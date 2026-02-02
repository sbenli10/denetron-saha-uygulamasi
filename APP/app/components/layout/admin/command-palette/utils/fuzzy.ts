export function fuzzyMatch(text: string, search: string) {
  const t = text.toLowerCase();
  const s = search.toLowerCase();

  let ti = 0;
  let si = 0;

  while (ti < t.length && si < s.length) {
    if (t[ti] === s[si]) si++;
    ti++;
  }

  return si === s.length;
}
