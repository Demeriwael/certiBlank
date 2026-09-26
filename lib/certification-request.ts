import { RequestValidationError } from "./request-security";

export function parseCertificationRequest(body: Record<string, unknown>) {
  const platform = typeof body.platform === "string" ? body.platform.trim().replace(/\s+/g, " ") : "";
  const certification = typeof body.certification === "string" ? body.certification.trim().replace(/\s+/g, " ") : "";
  if (!platform || platform.length > 80 || !certification || certification.length > 120 ||
      /[\u0000-\u001f\u007f]/.test(platform + certification)) {
    throw new RequestValidationError("Enter a platform (up to 80 characters) and certification (up to 120 characters).");
  }
  return { platform, certification };
}
