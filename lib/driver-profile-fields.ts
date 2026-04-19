export type DriverProfilePayload = {
  full_name: string;
  phone_number: string;
  car_model: string;
  car_number: string;
};

const MAX_NAME = 120;
const MAX_CAR_MODEL = 80;
const MAX_CAR_NUMBER = 40;

/** Normalize phone for storage (E.164-style when possible). */
export function normalizePhoneForStorage(raw: string): string {
  const t = raw.trim().replace(/\s/g, "");
  if (!t) return "";
  if (t.startsWith("+")) {
    const rest = t.slice(1).replace(/\D/g, "");
    return rest ? `+${rest}` : "";
  }
  const digits = t.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  return digits ? `+${digits}` : "";
}

/** 10-digit local part for default India (+91) entry UI; empty if not a clear India mobile. */
export function tenDigitIndiaLocalPart(raw: string): string {
  const n = normalizePhoneForStorage(raw);
  if (/^\+91\d{10}$/.test(n)) return n.slice(3);
  const digitsOnly = raw.replace(/\D/g, "");
  if (digitsOnly.length === 10) return digitsOnly;
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly.slice(2);
  }
  return "";
}

export function isIndia91TenDigitStored(raw: string): boolean {
  return /^\+91\d{10}$/.test(normalizePhoneForStorage(raw));
}

function isValidPhone(s: string): boolean {
  if (!s.trim()) return true;
  const x = s.trim().replace(/\s/g, "");
  if (/^\+[1-9]\d{6,14}$/.test(x)) return true;
  if (/^\d{10}$/.test(x)) return true;
  return false;
}

export function parseDriverProfileFormData(
  fd: FormData,
): { ok: true; data: DriverProfilePayload } | { ok: false; error: string } {
  const full_name = String(fd.get("full_name") ?? "").trim();
  if (!full_name || full_name.length > MAX_NAME) {
    return {
      ok: false,
      error: `Enter your name (1–${MAX_NAME} characters).`,
    };
  }

  const phone_raw = String(fd.get("phone_number") ?? "").trim();
  if (!isValidPhone(phone_raw)) {
    return {
      ok: false,
      error:
        "Use a valid phone: 10 digits or international format (e.g. +91…).",
    };
  }
  const phone_number = phone_raw ? normalizePhoneForStorage(phone_raw) : "";

  const car_model = String(fd.get("car_model") ?? "").trim();
  if (car_model.length > MAX_CAR_MODEL) {
    return { ok: false, error: "Car model is too long." };
  }

  const car_number = String(fd.get("car_number") ?? "").trim();
  if (car_number.length > MAX_CAR_NUMBER) {
    return { ok: false, error: "Car number is too long." };
  }

  return {
    ok: true,
    data: { full_name, phone_number, car_model, car_number },
  };
}

export function isDriverProfileIncomplete(p: {
  full_name?: string | null | undefined;
  phone_number: string | null | undefined;
  car_model: string | null | undefined;
  car_number: string | null | undefined;
}): boolean {
  return (
    !(p.full_name ?? "").trim() ||
    !(p.phone_number ?? "").trim() ||
    !(p.car_model ?? "").trim() ||
    !(p.car_number ?? "").trim()
  );
}
