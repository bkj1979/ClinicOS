import QRCode from "qrcode";

interface VerificationQr {
  url: string;
  dataUrl: string;
}

const verificationQrCache = new Map<string, Promise<VerificationQr>>();

export function getPrescriptionVerificationQr(prescriptionId: string): Promise<VerificationQr> {
  const cached = verificationQrCache.get(prescriptionId);
  if (cached) return cached;

  const request = (async () => {
    const response = await fetch("/api/prescriptions/verification-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prescriptionId }),
    });
    const result = await response.json() as { token?: string; error?: string };
    if (!response.ok || !result.token) {
      throw new Error(result.error || "Could not create a verification QR.");
    }

    const configuredBaseUrl = process.env.NEXT_PUBLIC_CLINICOS_BASE_URL?.trim();
    const baseUrl = new URL(configuredBaseUrl || window.location.origin);
    const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(baseUrl.hostname);
    if (baseUrl.protocol !== "https:" && !isLocalHost) {
      throw new Error("Prescription verification URLs must use HTTPS.");
    }
    if (baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
      throw new Error("Set NEXT_PUBLIC_CLINICOS_BASE_URL to the clinic's site origin only.");
    }
    const url = `${baseUrl.origin}/prescriptions/verify#token=${encodeURIComponent(result.token)}`;
    const dataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 192,
    });
    return { url, dataUrl };
  })();

  verificationQrCache.set(prescriptionId, request);
  void request.catch(() => verificationQrCache.delete(prescriptionId));
  return request;
}
