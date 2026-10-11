/**
 * Asks `/api/auth/email` to send a verification or password-reset email
 * (through Resend, not Firebase's own mailer). Throws with copy the form can
 * show as-is.
 */
export async function requestAccountEmail(kind: "verify" | "reset", email: string): Promise<void> {
  const res = await fetch("/api/auth/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, email }),
  }).catch(() => null);
  if (!res) throw new Error("Network error — check your connection and try again.");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Something went wrong. Please try again.");
  }
}
