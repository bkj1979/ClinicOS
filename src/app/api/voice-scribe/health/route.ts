export const runtime = "nodejs";

async function getSpeechService() {
  try {
    const response = await fetch("http://127.0.0.1:8765/health", {
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });
    if (!response.ok) return { ready: false };
    const result = await response.json() as { status?: string; speechModel?: string; loaded?: boolean };
    return {
      ready: result.status === "ready" && result.loaded === true,
      model: result.speechModel,
    };
  } catch {
    return { ready: false };
  }
}

async function getLanguageModel() {
  const model = process.env.CLINICOS_LOCAL_LLM_MODEL || "qwen2.5:1.5b";
  try {
    const response = await fetch("http://127.0.0.1:11434/api/tags", {
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });
    if (!response.ok) return { ready: false, model };
    const result = await response.json() as { models?: Array<{ name?: string }> };
    const installedModels = result.models?.map((item) => item.name) || [];
    return {
      ready: installedModels.some((name) => name === model || name?.startsWith(`${model}:`)),
      model,
    };
  } catch {
    return { ready: false, model };
  }
}

export async function GET() {
  const [speech, languageModel] = await Promise.all([getSpeechService(), getLanguageModel()]);
  return Response.json({ speech, languageModel }, { headers: { "Cache-Control": "no-store" } });
}
