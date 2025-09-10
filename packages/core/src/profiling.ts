import { FieldProfile } from './types';

/**
 * Profile a set of sampled rows to suggest type hints and value
 * distributions.  Used to help analysts map fields in weak APIs.
 */
export function profileFields(rows: any[]): FieldProfile[] {
  if (!rows || !rows.length) return [];
  const names = Object.keys(rows[0]);
  return names.map(name => {
    const col = rows.map(r => r[name]);
    const nonNull = col.filter(v => v !== null && v !== undefined);
    const nullRatio = 1 - nonNull.length / rows.length;
    const distinct = new Set(nonNull.map(v => String(v)));
    const topValues = Array.from(distinct)
      .slice(0, 10)
      .map(v => ({ value: v, count: nonNull.filter(x => String(x) === v).length }));
    const typeGuess = guess(nonNull);
    return { name, nullRatio, distinctCount: distinct.size, topValues, typeGuess };
  });
}

function guess(vals: any[]): string {
  const s = String(vals[0] ?? '');
  if (/^[0-9A-Za-z]{15,}$/.test(s)) return 'id';
  if (/^[A-Z]{2}$/i.test(s)) return 'country';
  if (/^\$?\d/.test(s)) return 'currency';
  if (/^\S+@\S+$/.test(s)) return 'email';
  return 'enum';
}