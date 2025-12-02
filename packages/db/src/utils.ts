/**
 * Generate a unique ID using crypto.randomUUID()
 * Format: Prefixed nanoid-style for readability
 */
export function createId(): string {
  return crypto.randomUUID();
}

/**
 * Create a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

