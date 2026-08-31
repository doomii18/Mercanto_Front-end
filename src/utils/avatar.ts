export function generateAvatarDataUrl(altText?: string | null): string {
  const trimmed = (altText || "").trim();
  const letter = trimmed ? trimmed.charAt(0).toUpperCase() : "?";

  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 45) % 360;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue1}, 65%, 45%)" />
          <stop offset="100%" stop-color="hsl(${hue2}, 65%, 35%)" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#grad)" />
      <text
        x="50%"
        y="50%"
        dy=".35em"
        text-anchor="middle"
        fill="#ffffff"
        font-family="sans-serif"
        font-size="48"
        font-weight="bold"
      >
        ${letter}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
