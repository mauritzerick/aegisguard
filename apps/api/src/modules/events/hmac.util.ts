import { createHmac } from 'crypto';

export function signBody(body: Buffer, secret: string): string {
  const h = createHmac('sha256', secret);
  h.update(body);
  return `sha256=${h.digest('hex')}`;
}

export function verifySignature(provided: string | undefined, body: Buffer, secret: string): boolean {
  if (!provided) return false;
  const expected = signBody(body, secret);
  return timingSafeEqualStr(provided, expected);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let isEqual = 0;
  for (let i = 0; i < a.length; i++) {
    isEqual |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return isEqual === 0;
}





