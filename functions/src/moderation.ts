import { HttpsError } from "firebase-functions/v2/https";
import type { CustomVerse } from "./types";

const MAX_TEXT_LENGTH = 140;
const MAX_REFERENCE_LENGTH = 40;
const MAX_NOTE_LENGTH = 200;

// Deliberately small — this is defense-in-depth re-validation of a limit the
// UI already enforces (see customise-view.tsx), not a real moderation
// system. docs/backend-plan.md flags a proper moderation/review step as an
// open decision, not yet built.
const BANNED_SUBSTRINGS = ["fuck", "shit", "nigger", "cunt", "faggot"];

function containsBannedWord(value: string): boolean {
  const lower = value.toLowerCase();
  return BANNED_SUBSTRINGS.some((w) => lower.includes(w));
}

/** Re-validates a custom verse server-side; throws HttpsError on anything the client should have already blocked. */
export function assertValidCustomVerse(verse: CustomVerse | undefined): void {
  if (!verse) return;
  const text = verse.text?.trim() ?? "";
  const reference = verse.reference?.trim() ?? "";
  const note = verse.note?.trim() ?? "";
  if (!text || !reference) {
    throw new HttpsError("invalid-argument", "Custom verse text and reference are required.");
  }
  if (text.length > MAX_TEXT_LENGTH || reference.length > MAX_REFERENCE_LENGTH) {
    throw new HttpsError("invalid-argument", "Custom verse text is too long.");
  }
  if (note.length > MAX_NOTE_LENGTH) {
    throw new HttpsError("invalid-argument", "Note is too long.");
  }
  if (containsBannedWord(text) || containsBannedWord(reference) || containsBannedWord(note)) {
    throw new HttpsError("invalid-argument", "Custom verse contains disallowed language.");
  }
}
