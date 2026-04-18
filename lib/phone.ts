/** Build `tel:` href from stored phone (E.164 preferred). */
export function toTelHref(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("+")) {
    return `tel:${trimmed.replace(/\s/g, "")}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) {
    return `tel:+91${digits}`;
  }
  return `tel:+${digits}`;
}
