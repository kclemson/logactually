/** A single image referenced by a parsed post, with optional intrinsic size. */
export interface ParsedImage {
  /** Remote URL the importer should download server-side. */
  url: string;
  width?: number;
  height?: number;
}

/**
 * A normalized post extracted from an import file. Deliberately
 * format-agnostic: every supported file format is parsed down into this same
 * shape so the review UI and import pipeline never know (or care) about the
 * original source.
 */
export interface ParsedPost {
  /** The originating file name, used as a stable id + fallback label. */
  sourceName: string;
  /** Post date as YYYY-MM-DD, or null if none could be detected. */
  date: string | null;
  /** Clean note text (structural lines stripped), may be empty. */
  note: string;
  /** Word count of `note`. */
  wordCount: number;
  /** First hashtag found in the content (kept verbatim, incl. `#`), or null. */
  category: string | null;
  /** Images in document order. */
  images: ParsedImage[];
}
