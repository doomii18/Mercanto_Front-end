import { CENTRAL_AMERICA_COUNTRIES, DEFAULT_PHONE_GROUPS } from "@/constants/phoneCountries";

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


/**
 * Extracts the 48-bit UTC millisecond timestamp from a UUIDv7 string.
 */
export function uuidv7ToDate(uuid: string): Date {
  const cleanHex = uuid.replace(/-/g, "").slice(0, 12);
  const timestampMs = parseInt(cleanHex, 16);
  return new Date(timestampMs);
}

/**
 * Parses a UUIDv7 or ISO timestamp, converts from UTC epoch, and formats to local time.
 */
export function formatUuidv7ToLocalTime(uuidOrIso: string): string {
  if (!uuidOrIso) return "";

  const cleanHex = uuidOrIso.replace(/-/g, "");
  const isUuid = cleanHex.length === 32;

  const date = isUuid ? uuidv7ToDate(uuidOrIso) : new Date(uuidOrIso);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

// Canonical lengths for Nicaraguan identity documents
export const NATIONAL_ID_LENGTH = 14;
export const TAX_ID_LENGTH = 14;

/**
 * Strips everything but letters/digits, uppercases and caps to the canonical length.
 * This is the canonical representation stored and sent to the backend.
 */
function sanitizeId(value: string, maxLength: number): string {
  if (!value) return "";
  return value
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .substring(0, maxLength);
}

/** Canonical cédula: 13 digits + final letter (e.g. "0013007660022M"). */
export function sanitizeNationalId(value: string): string {
  return sanitizeId(value, NATIONAL_ID_LENGTH);
}

/** Canonical RUC: J/N/E/R + 13 digits or 13 digits + letter (e.g. "J0310000007669"). */
export function sanitizeTaxId(value: string): string {
  return sanitizeId(value, TAX_ID_LENGTH);
}

function formatGroups(cleaned: string, groups: number[], separator = "-"): string {
  const parts: string[] = [];
  let cursor = 0;
  for (const size of groups) {
    if (cursor >= cleaned.length) break;
    parts.push(cleaned.substring(cursor, cursor + size));
    cursor += size;
  }
  if (cursor < cleaned.length) {
    parts.push(cleaned.substring(cursor));
  }
  return parts.join(separator);
}

/**
 * Human-readable cédula: 3-6-5 (municipality, birth date, sequence+letter).
 * e.g. "001-300766-0022M". Display only — never persist this value.
 */
export function formatCedula(value: string): string {
  const cleaned = sanitizeNationalId(value);
  if (!cleaned) return "";
  return formatGroups(cleaned, [3, 6, 5]);
}

/** Alias for `formatCedula` used by the identity input/display components. */
export const formatNationalId = formatCedula;

/**
 * Human-readable RUC: 4-6-4 when prefixed by J/N/E/R (e.g. "J031-000000-7669"),
 * otherwise cédula-style 3-6-5 (e.g. "001-300766-0022M"). Display only.
 */
export function formatRuc(value: string): string {
  const cleaned = sanitizeTaxId(value);
  if (!cleaned) return "";
  const groups = /^[JNER]/.test(cleaned) ? [4, 6, 4] : [3, 6, 5];
  return formatGroups(cleaned, groups);
}

/** Alias for `formatRuc` used by the tax input/display components. */
export const formatTaxId = formatRuc;

/**
 * Canonical phone number in E.164 globalized form: a leading `+` (when present)
 * followed by digits only (e.g. "+50588888888"). This is what is stored and sent.
 */
export function sanitizePhone(value: string): string {
  if (!value) return "";
  const hadPlus = value.includes("+");
  const digits = value.replace(/[^0-9]/g, "");
  return hadPlus ? `+${digits}` : digits;
}

export interface ParsedPhone {
  country?: (typeof CENTRAL_AMERICA_COUNTRIES)[number];
  dialCode: string;
  subscriber: string;
}

/**
 * Splits a phone number into a known country (when the dial code matches),
 * its dial code and the national significant number (digits only).
 */
export function parsePhone(value: string): ParsedPhone {
  const cleaned = sanitizePhone(value);
  const digits = cleaned.replace(/^\+/, "");

  const sorted = [...CENTRAL_AMERICA_COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );
  const matched = sorted.find((c) => cleaned.startsWith(c.dialCode));

  if (matched) {
    return {
      country: matched,
      dialCode: matched.dialCode,
      subscriber: digits.slice(matched.dialCode.length - 1),
    };
  }

  return { dialCode: "", subscriber: digits };
}

/**
 * Human-readable phone number following ITU-T E.123: `+` prefix and spaces for
 * digit grouping, country-aware (e.g. "+505 8787 8787", "+1 202 555 0123").
 * Display only — never persist this value.
 */
export function formatPhone(value: string): string {
  const cleaned = sanitizePhone(value);
  if (!cleaned) return "";

  const sorted = [...CENTRAL_AMERICA_COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );
  const matched = sorted.find((c) => cleaned.startsWith(c.dialCode));

  if (matched) {
    const digits = cleaned.replace(/^\+/, "").slice(matched.dialCode.length - 1);
    return `${matched.dialCode} ${formatGroups(digits, matched.groups, " ")}`;
  }

  const digits = cleaned.replace(/^\+/, "");
  const prefix = cleaned.startsWith("+") ? "+" : "";
  return `${prefix}${formatGroups(digits, DEFAULT_PHONE_GROUPS, " ")}`;
}
