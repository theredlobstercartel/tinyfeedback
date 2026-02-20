/**
 * Generate a unique API key for projects
 * Format: tf_live_<random_string>
 */
export function generateApiKey(): string {
  const prefix = 'tf_live_';
  const randomPart = Array.from({ length: 24 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
  return `${prefix}${randomPart}`;
}
