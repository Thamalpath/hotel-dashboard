import Hashids from 'hashids';

// The salt should ideally be in env variables, but this is a frontend obfuscator.
const hashids = new Hashids('merchant-website-obfuscation-secret', 10);

export const encodeId = (id: number): string => {
  return hashids.encode(id);
};

export const decodeId = (hash: string): number | null => {
  try {
    const decoded = hashids.decode(hash);
    return decoded.length > 0 ? (decoded[0] as number) : null;
  } catch {
    return null;
  }
};
