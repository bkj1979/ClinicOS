import asyncio
import logging
import os
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from faster_whisper import WhisperModel

logger = logging.getLogger("clinicos.voice_scribe")
MODEL_NAME = os.getenv("CLINICOS_WHISPER_MODEL", "base")
UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024
ALLOWED_EXTENSIONS = {".webm", ".wav", ".mp4", ".ogg", ".m4a", ".mp3"}
model: WhisperModel | None = None
transcription_lock = asyncio.Lock()


def transcribe_file(path: str, language: str | None):
    if model is None:
        raise RuntimeError("The local speech model is not ready.")
    segments, info = model.transcribe(
        path,
        language=language,
        beam_size=3,
        vad_filter=True,
    )
    transcript = " ".join(segment.text.strip() for segment in segments if segment.text.strip())
    return transcript, info.language, info.duration


@asynccontextmanager
async def lifespan(_: FastAPI):
    global model
    model = WhisperModel(MODEL_NAME, device="cpu", compute_type="int8")
    yield
    model = None


app = FastAPI(title="ClinicOS Local Voice Scribe", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ready", "speechModel": MODEL_NAME, "loaded": model is not None}


@app.post("/transcribe")
async def transcribe(
    audio: Annotated[UploadFile, File()],
    language: Annotated[str, Form()] = "en",
):
    if model is None:
        raise HTTPException(status_code=503, detail="The local speech model is not ready.")
    suffix = Path(audio.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported audio format.")
    if language not in {"en", "hi", "kn", "ta", "te"}:
        raise HTTPException(status_code=400, detail="Unsupported transcription language.")

    temporary_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temporary_file:
            temporary_path = temporary_file.name
            size = 0
            while chunk := await audio.read(1024 * 1024):
                size += len(chunk)
                if size > UPLOAD_LIMIT_BYTES:
                    raise HTTPException(status_code=413, detail="Recording exceeds the 100 MB limit.")
                temporary_file.write(chunk)

        if size == 0:
            raise HTTPException(status_code=400, detail="The recording is empty.")

        selected_language = None if language == "auto" else language
        async with transcription_lock:
            transcript, detected_language, duration = await asyncio.to_thread(
                transcribe_file,
                temporary_path,
                selected_language,
            )
        if not transcript:
            raise HTTPException(
                status_code=422,
                detail="No speech was detected. Check the microphone recording and try again.",
            )
        return {
            "text": transcript,
            "language": detected_language,
            "durationSeconds": duration,
        }
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Local speech transcription failed")
        raise HTTPException(
            status_code=500,
            detail="Local transcription failed. Check the audio format and local speech model.",
        ) from error
    finally:
        await audio.close()
        if temporary_path:
            Path(temporary_path).unlink(missing_ok=True)
