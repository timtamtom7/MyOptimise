import { format } from "date-fns";

export type FormatOptions = {
  timeZone?: string;
  formatStr?: string;
};

export function formatDateTime(
  date: Date | string | number | null | undefined,
  options: string | FormatOptions = "MMM d, yyyy h:mm a zzz"
): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  if (typeof options === "string") {
    return format(d, options);
  }

  const { timeZone, formatStr = "MMM d, yyyy h:mm a zzz" } = options;

  if (timeZone) {
    try {
      return d.toLocaleString("en-US", {
        timeZone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short'
      });
    } catch (e) {
      console.error("Invalid timezone:", timeZone);
      return format(d, formatStr);
    }
  }

  return format(d, formatStr);
}

export function formatDate(
  date: Date | string | number | null | undefined,
  options: string | FormatOptions = "MMM d, yyyy"
): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  if (typeof options === "string") {
    return format(d, options);
  }

  const { timeZone, formatStr = "MMM d, yyyy" } = options;

  if (timeZone) {
    try {
      return d.toLocaleDateString("en-US", {
        timeZone,
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return format(d, formatStr);
    }
  }

  return format(d, formatStr);
}
