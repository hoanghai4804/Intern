export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const formatDate = (date: Date): string => {
  try {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Handle invalid dates or future dates
    if (diff < 0 || isNaN(diff)) {
      return date.toLocaleString();
    }
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    // Fallback to simple date string
    return date.toLocaleString();
  }
};

export const formatStatus = (status: string) => {
  switch (status) {
    case 'success':
      return { label: 'Success', color: 'success' };
    case 'error':
      return { label: 'Error', color: 'error' };
    case 'warning':
      return { label: 'Warning', color: 'warning' };
    default:
      return { label: status, color: 'default' };
  }
}; 