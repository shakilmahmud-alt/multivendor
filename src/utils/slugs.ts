export const generateSlug = (text: string) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/&/g, '-')           // Replace & with -
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with -
    .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
};
