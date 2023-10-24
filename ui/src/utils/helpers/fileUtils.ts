export function getFileNameFromContentDisposition(
  contentDisposition: string,
): string {
  if (!contentDisposition) {
    return '';
  }

  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  return match ? match[1] : '';
}
