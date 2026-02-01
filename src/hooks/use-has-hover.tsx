// Read once at module load - device capabilities don't change mid-session
const HAS_HOVER = typeof window !== "undefined"
  ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
  : true; // SSR: assume desktop

export function useHasHover(): boolean {
  return HAS_HOVER;
}
