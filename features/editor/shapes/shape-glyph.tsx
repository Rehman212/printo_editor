export function ShapeGlyph({ kind }: { kind: string }) {
  const common = {
    fill: "#8a8a8a",
    stroke: "#8a8a8a",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8">
      {kind === "line" && <line x1="6" y1="24" x2="42" y2="24" {...common} />}
      {kind === "diamond" && <polygon points="24,6 42,24 24,42 6,24" fill={common.fill} />}
      {kind === "triangle" && <polygon points="24,8 40,40 8,40" fill={common.fill} />}
      {kind === "square" && <rect x="10" y="10" width="28" height="28" fill={common.fill} />}
      {kind === "star" && (
        <polygon
          points="24,6 28,18 41,18 31,26 35,38 24,31 13,38 17,26 7,18 20,18"
          fill={common.fill}
        />
      )}
      {kind === "pentagon" && <polygon points="24,6 42,20 35,40 13,40 6,20" fill={common.fill} />}
      {kind === "rectangle" && <rect x="8" y="16" width="32" height="16" fill={common.fill} />}
      {kind === "heart" && (
        <path
          d="M24 40s-14-8.6-14-18A8 8 0 0 1 24 16a8 8 0 0 1 14 6c0 9.4-14 18-14 18z"
          fill={common.fill}
        />
      )}
      {kind === "arrow" && <polygon points="8,20 28,20 28,12 42,24 28,36 28,28 8,28" fill={common.fill} />}
      {kind === "burst" && (
        <polygon
          points="24,4 27,16 40,10 32,20 44,24 32,28 40,38 27,32 24,44 21,32 8,38 16,28 4,24 16,20 8,10 21,16"
          fill={common.fill}
        />
      )}
      {kind === "check" && (
        <path d="M10 24 l9 9 19-20" fill="none" stroke={common.stroke} strokeWidth="4" />
      )}
      {kind === "circle" && <circle cx="24" cy="24" r="14" fill={common.fill} />}
      {kind === "cloud" && (
        <path
          d="M16 34h18a8 8 0 0 0 1-16 10 10 0 0 0-19-2 7 7 0 0 0 0 18z"
          fill={common.fill}
        />
      )}
      {kind === "cloud-outline" && (
        <path
          d="M16 34h18a8 8 0 0 0 1-16 10 10 0 0 0-19-2 7 7 0 0 0 0 18z"
          fill="none"
          stroke={common.stroke}
          strokeWidth="2.4"
        />
      )}
    </svg>
  );
}
