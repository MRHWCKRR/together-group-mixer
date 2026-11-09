export function parsePeople(text) {
  const names = text.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
  if (new Set(names.map(n => n.toLowerCase())).size !== names.length) throw new Error('Some names are repeated. Add a surname or initial to make each name unique.');
  return names;
}
export function bundlesFor(names, links) {
  const parent = names.map((_, i) => i);
  const root = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  for (const [a, b] of links) {
    if (a === b) throw new Error('Choose two different people. You cannot nominate yourself.');
    const i = names.indexOf(a), j = names.indexOf(b);
    if (i < 0 || j < 0) throw new Error('A nomination includes a name that is no longer in your list. Remove it or restore the name.');
    parent[root(i)] = root(j);
  }
  const bundles = new Map();
  names.forEach((name, i) => { const r = root(i); if (!bundles.has(r)) bundles.set(r, []); bundles.get(r).push(name); });
  return [...bundles.values()];
}
function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function validateNomination(names, links, a, b) {
  if (!a || !b) throw new Error('Choose two people to add a nomination.');
  if (a === b) throw new Error('Choose two different people. You cannot nominate yourself.');
  if (links.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) throw new Error('That nomination is already added.');
  const bundles = bundlesFor(names, links);
  if (!names.includes(a) || !names.includes(b)) throw new Error('Choose people from your current list.');
  if (bundles.some(bundle => bundle.includes(a) && bundle.includes(b))) throw new Error('That nomination would make a loop back to the same person. These people are already connected.');
}
const signature = groups => JSON.stringify(groups.map(g => [...g].sort()).sort());
export function generateGroups(names, links, mode, value, random = Math.random, previous = []) {
  if (!names.length) throw new Error('Add at least one person to make groups.');
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('Choose a whole number of 1 or more.');
  bundlesFor(names, links);
  if (mode !== 'count' && mode !== 'size') throw new Error('Choose a grouping method.');
  if (mode === 'count' && value > names.length) throw new Error('You cannot make more groups than people.');
  const count = mode === 'count' ? value : Math.ceil(names.length / value);
  const capacities = Array.from({ length: count }, (_, i) => Math.floor(names.length / count) + (i < names.length % count ? 1 : 0));
  const groups = capacities.map(() => []);
  const friends = new Map(names.map(name => [name, new Set()]));
  for (const [a, b] of links) { friends.get(a).add(b); friends.get(b).add(a); }
  for (const name of shuffle(names, random)) {
    const choices = groups.map((group, i) => ({ group, weight: group.length < capacities[i] ? 1 + 4 * group.filter(member => friends.get(name).has(member)).length : 0 }));
    let pick = random() * choices.reduce((sum, choice) => sum + choice.weight, 0);
    for (const { group, weight } of choices) {
      pick -= weight;
      if (weight && pick < 0) { group.push(name); break; }
    }
  }
  // Changing group labels alone is not a new mix; swap members if the partition repeats.
  if (previous.length && signature(groups) === signature(previous)) {
    const larger = shuffle(groups.filter(g => g.length > 1), random)[0];
    const other = shuffle(groups.filter(g => g !== larger), random)[0];
    if (larger && other) {
      const a = Math.floor(random() * larger.length), b = Math.floor(random() * other.length);
      [larger[a], other[b]] = [other[b], larger[a]];
    }
  }
  return shuffle(groups, random).map(g => shuffle(g, random));
}
