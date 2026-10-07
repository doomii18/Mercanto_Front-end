export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  /** Display grouping (in digits) of the national significant number. */
  groups: number[];
}

export const CENTRAL_AMERICA_COUNTRIES: CountryOption[] = [
  { code: "NI", name: "Nicaragua", dialCode: "+505", flag: "🇳🇮", placeholder: "8787 8787", groups: [4, 4] },
  { code: "CR", name: "Costa Rica", dialCode: "+506", flag: "🇨🇷", placeholder: "8787 8787", groups: [4, 4] },
  { code: "HN", name: "Honduras", dialCode: "+504", flag: "🇭🇳", placeholder: "9787 8787", groups: [4, 4] },
  { code: "SV", name: "El Salvador", dialCode: "+503", flag: "🇸🇻", placeholder: "7787 8787", groups: [4, 4] },
  { code: "GT", name: "Guatemala", dialCode: "+502", flag: "🇬🇹", placeholder: "5787 8787", groups: [4, 4] },
  { code: "PA", name: "Panamá", dialCode: "+507", flag: "🇵🇦", placeholder: "6787 8787", groups: [4, 4] },
  { code: "BZ", name: "Belice", dialCode: "+501", flag: "🇧🇿", placeholder: "678 7878", groups: [3, 4] },
  { code: "US", name: "Estados Unidos", dialCode: "+1", flag: "🇺🇸", placeholder: "202 555 0123", groups: [3, 3, 4] },
];

/** Grouping used when the dial code is not in the known list. */
export const DEFAULT_PHONE_GROUPS = [3, 3, 3, 3, 3];
