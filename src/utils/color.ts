export const getColorStyle = (codes: string[]) => {
  if (!codes || codes.length === 0) return {};
  if (codes.length === 1) return { backgroundColor: codes[0] };
  if (codes.length === 2) return { background: `linear-gradient(90deg, ${codes[0]} 50%, ${codes[1]} 50%)` };
  
  let gradient = [];
  let step = 100 / codes.length;
  for (let i = 0; i < codes.length; i++) {
    gradient.push(`${codes[i]} ${i * step}% ${(i + 1) * step}%`);
  }
  return { background: `conic-gradient(${gradient.join(', ')})` };
};
