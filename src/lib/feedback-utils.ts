export const truncate = (text: string, maxLen = 80) => {
  const firstLine = text.split('\n')[0];
  if (firstLine.length <= maxLen) return firstLine;
  return firstLine.slice(0, maxLen) + '…';
};
