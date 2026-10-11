import { FirebaseError } from "firebase/app";

/** Maps Firebase Auth error codes to copy a shopper/admin can act on. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "An account with that email already exists.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Incorrect email or password.";
      case "auth/weak-password":
        return "Please use a stronger password (6+ characters).";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again in a moment.";
      case "auth/expired-action-code":
        return "This link has expired. Please request a new one.";
      case "auth/invalid-action-code":
        return "This link is invalid or has already been used. Please request a new one.";
      case "auth/network-request-failed":
        return "Network error — check your connection and try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  return "Something went wrong. Please try again.";
}
