export type MessageAuthorLike = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
};

export const formatSender = (author: MessageAuthorLike): string => {
  if (author.displayName && author.displayName.trim()) {
    return author.displayName;
  }
  const parts = [author.firstName, author.lastName].filter((part) => part && String(part).trim());
  if (parts.length) {
    return parts.join(" ");
  }
  return author.email;
};

export const formatPreview = (content: string): string => {
  const normalized = content.trim();
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
};

export const formatSentAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Nežinomas laikas";
  }
  return new Intl.DateTimeFormat("lt-LT", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export type UnreadComputable = {
  isOwn: boolean;
  createdAt: string;
};

export const computeUnread = (item: UnreadComputable): boolean => {
  if (item.isOwn) {
    return false;
  }
  const created = new Date(item.createdAt);
  if (Number.isNaN(created.getTime())) {
    return false;
  }
  const now = Date.now();
  return now - created.getTime() < 48 * 60 * 60 * 1000;
};
