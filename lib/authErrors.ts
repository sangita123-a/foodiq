type AxiosLikeError = {
  response?: {
    status?: number;
    data?: { message?: string; error?: unknown };
  };
  message?: string;
  code?: string;
};

export function getAuthErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;

  const axiosErr = err as AxiosLikeError;
  const responseMessage = axiosErr.response?.data?.message;
  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage.trim();
  }

  const errField = axiosErr.response?.data?.error;
  if (typeof errField === "string" && errField.trim()) return errField.trim();
  if (errField && typeof errField === "object" && "detail" in errField) {
    const detail = (errField as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) return detail.trim();
  }

  const status = axiosErr.response?.status;
  if (status === 403) return "Request blocked. Please refresh the page and try again.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status && status >= 500) return "Server error. Please try again in a few seconds.";

  if (typeof axiosErr.message === "string" && axiosErr.message.trim()) {
    return axiosErr.message.trim();
  }

  if (axiosErr.code === "ECONNABORTED") {
    return "Request timed out. Please check your connection and try again.";
  }

  return fallback;
}
