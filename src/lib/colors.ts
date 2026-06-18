export const C = {
  bg: "#0D1117",
  card: "#161C26",
  line: "#242D3D",
  text: "#EAEFF7",
  mut: "#8593AD",
  em: "#34D399",
  gold: "#E8B44F",
  blue: "#60A5FA",
  red: "#F87171",
} as const;

export const GCOL: Record<string, string> = {
  Cash: C.blue,
  Investments: C.em,
  Retirement: C.gold,
};
