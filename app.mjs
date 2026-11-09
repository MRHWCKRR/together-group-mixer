import { parsePeople, bundlesFor, generateGroups, validateNomination } from './groups.mjs';
const $ = id => document.getElementById(id);
let links = [], mode = 'count', groups = [], runs = 0;
const initialResults = $('result-body').innerHTML;
const colors = [['#edf1ff','#4563b4'],['#eaf5ef','#3d7b61'],['#fff2e3','#926936'],['#f3edfc','#7b5a9f']];
function element(tag, text, className) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; }
function shuffleIcon() { const icon = element('span', '⤨'); icon.setAttribute('aria-hidden', 'true'); return icon; }
function error(message = '') { $('error').textContent = message; $('error').hidden = !message; }
function save() { try { localStorage.setItem('together-v1', JSON.stringify({ names: $('names').value, links, mode, value: $('group-value').value })); } catch {} }
function invalidate() {
  groups = []; runs = 0; $('copy').hidden = true; $('result-body').innerHTML = initialResults;
  $('result-meta').textContent = 'Your next great group starts here.';
  $('generate').replaceChildren(shuffleIcon(), document.createTextNode(' Generate groups'));
  $('empty-sample').onclick = example;
  error(); save();
}
function refresh() {
  let names;
  try { names = parsePeople($('names').value); } catch (e) { error(e.message); names = []; }
  $('people-count').textContent = `${names.length} ${names.length === 1 ? 'person' : 'people'}`;
  for (const [id, placeholder] of [['person-a', 'Choose a person'], ['person-b', 'Their nomination']]) {
    const select = $(id), selected = select.value;
    select.replaceChildren(new Option(placeholder, ''), ...names.map(n => new Option(n, n)));
    if (names.includes(selected)) select.value = selected;
  }
  updateNominationChoices();
  $('links').replaceChildren(...links.map(([a, b], i) => {
    const chip = element('span', undefined, 'link-chip');
    chip.append(element('span', `${a} ↔ ${b}`));
    const remove = element('button', '×'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove nomination between ${a} and ${b}`);
    remove.onclick = () => { links.splice(i, 1); invalidate(); refresh(); };
    chip.append(remove); return chip;
  }));
  $('bundle-summary').hidden = true;
  try {
    const bundles = bundlesFor(names, links).filter(b => b.length > 1);
    if (bundles.length) { $('bundle-summary').hidden = false; $('bundle-summary').textContent = `Preferred connections: ${bundles.map(b => b.join(' + ')).join('; ')}.`; }
  } catch (e) { error(e.message); }
}
function setMode(next) {
  mode = next;
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('value-label').textContent = mode === 'count' ? 'How many groups?' : 'Maximum people in each group?';
  $('size-hint').textContent = mode === 'count' ? 'Even sizes, with nominations given a preference.' : 'Nominations are preferred, but can split to fit.';
}
function generate() {
  try {
    const names = parsePeople($('names').value);
    const nextGroups = generateGroups(names, links, mode, Number($('group-value').value), undefined, groups);
    groups = nextGroups; runs++; error();
    const kept = links.filter(([a, b]) => groups.some(g => g.includes(a) && g.includes(b)));
    const linked = new Set(kept.flat());
    const grid = element('div', undefined, 'group-grid');
    groups.forEach((members, i) => {
      const card = element('article', undefined, 'group-card'), [tint, ink] = colors[i % colors.length];
      card.style.setProperty('--tint', tint); card.style.setProperty('--ink', ink);
      const header = element('header'); header.append(element('h3', `Group ${i + 1}`), element('small', `${members.length} ${members.length === 1 ? 'person' : 'people'}`));
      const list = element('ul');
      members.forEach(name => { const item = element('li'); item.append(element('span', name.slice(0, 1).toUpperCase(), 'person-avatar'), element('span', name)); if (linked.has(name)) { const mark = element('span', '↔', 'linked-marker'); mark.title = 'Nomination kept together'; mark.setAttribute('aria-label', 'Nomination kept together'); item.append(mark); } list.append(item); });
      card.append(header, list); grid.append(card);
    });
    $('result-body').replaceChildren(grid); $('copy').hidden = false;
    $('result-meta').textContent = `${names.length} people in ${groups.length} ${groups.length === 1 ? 'group' : 'groups'} · Mix ${runs}${links.length ? ` · ${kept.length}/${links.length} nominations kept` : ''}`;
    $('generate').replaceChildren(shuffleIcon(), document.createTextNode(' Shuffle again'));
    $('status').textContent = `Mix ${runs} ready. ${groups.length} groups generated. ${kept.length} of ${links.length} nominations kept together.`;
    save();
  } catch (e) { error(e.message); }
}
function example() {
  $('names').value = 'Alex\nJamie\nSam\nMorgan\nRiley\nTaylor\nJordan\nCasey\nCharlie\nAvery\nQuinn\nRobin';
  links = [['Alex', 'Jamie'], ['Jamie', 'Sam'], ['Riley', 'Taylor']];
  setMode('count'); $('group-value').value = '3'; invalidate(); refresh(); generate();
}
function updateNominationChoices() {
  const a = $('person-a').value, b = $('person-b').value;
  for (const option of $('person-a').options) option.disabled = !!option.value && option.value === b;
  for (const option of $('person-b').options) option.disabled = !!option.value && option.value === a;
  $('add-link').disabled = !a || !b || a === b;
}
$('person-a').onchange = updateNominationChoices;
$('person-b').onchange = updateNominationChoices;
$('names').addEventListener('input', () => { invalidate(); refresh(); });
$('group-value').addEventListener('input', invalidate);
$('add-link').onclick = () => {
  const a = $('person-a').value, b = $('person-b').value;
  try { validateNomination(parsePeople($('names').value), links, a, b); } catch (e) { return error(e.message); }
  links.push([a, b]); invalidate(); refresh();
};
document.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => { setMode(button.dataset.mode); invalidate(); });
$('sample').onclick = example; $('generate').onclick = generate;
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText(groups.map((g, i) => `Group ${i + 1}\n${g.join('\n')}`).join('\n\n')); $('status').textContent = 'Groups copied to clipboard.'; $('copy').textContent = 'Copied!'; setTimeout(() => { $('copy').textContent = 'Copy groups'; }, 1800); }
  catch { error('Couldn’t access the clipboard. Select your group names and copy them manually.'); }
};
try {
  const saved = JSON.parse(localStorage.getItem('together-v1'));
  if (saved && typeof saved.names === 'string' && Array.isArray(saved.links) && saved.links.every(l => Array.isArray(l) && l.length === 2 && l.every(n => typeof n === 'string'))) {
    $('names').value = saved.names; links = saved.links.filter(([a, b]) => a !== b); setMode(saved.mode === 'size' ? 'size' : 'count'); $('group-value').value = saved.value || '3';
  }
} catch {}
$('empty-sample').onclick = example; refresh();
