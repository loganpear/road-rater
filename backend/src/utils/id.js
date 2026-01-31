import { randomBytes } from 'crypto';

export function makeId(prefix) {
  const random = randomBytes(16).toString('hex');
  return `${prefix}_${random}`;
}
