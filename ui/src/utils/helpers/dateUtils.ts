export function timeSince(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;

  if (interval > 1) {
    return date.toLocaleDateString('en-AU');
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return date.toLocaleDateString('en-AU');
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return date.toLocaleDateString('en-AU');
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval).toString() + ' hours';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval).toString() + ' minutes';
  }
  return Math.floor(seconds).toString() + ' seconds';
}
