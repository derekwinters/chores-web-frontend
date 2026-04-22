const PALETTE = [
  '#3B6EA0',
  '#8B5E8A',
  '#4A8C6F',
  '#C4743A',
  '#5B8CC4',
  '#C4503A',
];

export function getPersonColor(name) {
  if (!name) return '#7899b8';
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function getPersonInitial(name) {
  return name ? name[0].toUpperCase() : '?';
}
