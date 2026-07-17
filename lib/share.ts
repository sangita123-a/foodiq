export async function shareContent(options: {
  title: string;
  text?: string;
  url?: string;
  onCopied?: () => void;
}) {
  const url = options.url || (typeof window !== "undefined" ? window.location.href : "");
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: options.title, text: options.text, url });
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      options.onCopied?.();
    }
  } catch {
    // User cancelled native share dialog — no error needed.
  }
}
