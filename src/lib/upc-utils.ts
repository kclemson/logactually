// Detect UPC patterns in text input to route to database lookup
export function extractUpcFromText(input: string): string | null {
  // "UPC code: 717524611109", "UPC: 717524611109", "barcode: 717524611109", "Scanned: 717524611109"
  const prefixMatch = input.match(
    /(?:upc|barcode|scanned)(?:\s+(?:code|number))?[\s:]+(\d[\d\s]{6,})/i
  );
  if (prefixMatch) {
    return prefixMatch[1].replace(/\s/g, "");
  }

  // Pure digits (8-14 characters, standard UPC/EAN lengths)
  const trimmed = input.trim();
  if (/^\d{8,14}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}
