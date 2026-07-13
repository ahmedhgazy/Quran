/**
 * Utility to normalize Arabic text.
 * Strips tashkeel (diacritics), standardizes hamzas, tatweel, and prepares
 * text for accurate speech recognition and search matching.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  return text
    // Remove diacritics / tashkeel
    .replace(/[\u064B-\u0652\u0670]/g, '')
    // Standardize Hamza formats (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Standardize Ta Marbuta (ة -> ه)
    .replace(/ة/g, 'ه')
    // Standardize Alif Maksura (ى -> ي)
    .replace(/ى/g, 'ي')
    // Remove tatweel (kashida extension line)
    .replace(/\u0640/g, '')
    // Replace punctuation and symbols with space
    .replace(/[^\w\s\u0621-\u064A]/g, ' ')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    .trim();
}
