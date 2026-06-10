import { createHmac } from "crypto";

export function getKlingCredentials(): { accessKey: string; secretKey: string } {
  const accessKey = process.env.KLING_ACCESS_KEY || process.env.KLING_AK;
  const secretKey = process.env.KLING_SECRET_KEY || process.env.KLING_SK;

  if (!accessKey || !secretKey) {
    throw new Error(
      "Kling AI credentials not configured. Add KLING_ACCESS_KEY and KLING_SECRET_KEY to .env.local (from app.klingai.com → Developer → API Keys)."
    );
  }

  return { accessKey, secretKey };
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function createKlingJwt(): string {
  const { accessKey, secretKey } = getKlingCredentials();
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: accessKey,
      exp: now + 1800,
      nbf: now - 5,
    })
  );

  const signingInput = `${header}.${payload}`;
  const signature = createHmac("sha256", secretKey).update(signingInput).digest("base64url");

  return `${signingInput}.${signature}`;
}

export function isKlingConfigured(): boolean {
  try {
    getKlingCredentials();
    return true;
  } catch {
    return false;
  }
}
