const PALETTE_SIZE = 14;

/** First letter of the name, uppercased. */
export const initialOf = (name) => (name.trim()[0] ?? '?').toUpperCase();

/** djb2 string hash, unsigned. */
function hash(value) {
  let h = 5381;
  for (const ch of value) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return h >>> 0;
}

/**
 * Stable avatar background token for a user id: '--color-avatar-1' … '--color-avatar-14'.
 * @param {string} userId
 */
export const avatarToken = (userId) => `--color-avatar-${(hash(userId) % PALETTE_SIZE) + 1}`;
