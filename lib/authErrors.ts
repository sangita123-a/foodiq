export function getAuthErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as {
      response?: { data?: { message?: string; error?: unknown } };
      message?: string;
    };
    const msg = axiosErr.response?.data?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
    const errField = axiosErr.response?.data?.error;
    if (typeof errField === "string" && errField.trim()) return errField;
  }
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    (err as { message?: string }).message === "Network Error"
  ) {
    return "Cannot reach the server. Please check your backend connection.";
  }
  return fallback;
}
