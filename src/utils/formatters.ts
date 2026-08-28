const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Losslessly encodes a standard 128-bit UUID string into a 26-character Crockford Base32 string.
 */
export function uuidToCrockford(uuid: string): string {
  const hex = uuid.replace(/-/g, "");
  if (!hex || hex.length !== 32) return uuid;

  let num = BigInt(`0x${hex}`);
  let encoded = "";

  for (let i = 0; i < 26; i++) {
    const remainder = Number(num & 31n);
    encoded = CROCKFORD_ALPHABET[remainder] + encoded;
    num >>= 5n;
  }

  return `${encoded.slice(0, 5)}-${encoded.slice(5, 10)}-${encoded.slice(10, 15)}-${encoded.slice(15, 20)}-${encoded.slice(20)}`;
}

/**
 * Losslessly decodes a 26-character Crockford Base32 string back to the canonical UUID.
 */
export function crockfordToUuid(crockford: string): string {
  const clean = crockford
    .replace(/[^0-9A-Za-z]/g, "")
    .toUpperCase()
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");

  let num = 0n;
  for (const char of clean) {
    const val = CROCKFORD_ALPHABET.indexOf(char);
    if (val === -1) throw new Error(`Invalid Crockford character: ${char}`);
    num = (num << 5n) | BigInt(val);
  }

  const hex = num.toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
