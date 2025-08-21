export type Key = `${string}|${string}`; 

export const CTR_BENCH: Record<Key, number> = {
  "Gambling - Online gambling|NG": 0.008, 
  "Gambling - Online gambling|SE": 0.010, 
};

export function getCTR(category: string, iso2: string) {
  return CTR_BENCH[`${category}|${iso2}`];
}
