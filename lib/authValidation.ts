const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

export type AuthFieldErrors = {
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
};

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Email is required";
  if (!EMAIL_REGEX.test(value)) return "Enter a valid email address (example: name@example.com)";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include uppercase, lowercase, and a number";
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  const value = phone.trim();
  if (!value) return "Phone number is required";
  if (!PHONE_REGEX.test(value)) return "Enter a valid phone number (7–20 digits)";
  return null;
}

export function validateFullName(fullName: string): string | null {
  const value = fullName.trim();
  if (!value) return "Full name is required";
  if (value.length < 2) return "Full name must be at least 2 characters";
  return null;
}

export function validateRegisterForm(input: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const fullNameError = validateFullName(input.full_name);
  const emailError = validateEmail(input.email);
  const phoneError = validatePhone(input.phone);
  const passwordError = validatePassword(input.password);
  if (fullNameError) errors.full_name = fullNameError;
  if (emailError) errors.email = emailError;
  if (phoneError) errors.phone = phoneError;
  if (passwordError) errors.password = passwordError;
  return errors;
}

export function validateLoginForm(input: { email: string; password: string }): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  if (!input.password.trim()) errors.password = "Password is required";
  return errors;
}
