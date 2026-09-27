"use client";

import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { toast } from "sonner";
import { firebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/store/auth";
import { Card } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_LENGTH = 8;

function passwordErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Your current password is incorrect.";
      case "auth/weak-password":
        return "That password is too weak — try a longer one.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a few minutes and try again.";
    }
  }
  return "Couldn't change your password. Please try again.";
}

/** Signed-in admin's details plus a change-password form (Firebase requires re-auth first). */
export function AccountCard() {
  const user = useAuth((s) => s.user);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < MIN_LENGTH) {
      toast.error(`New password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (next !== confirm) {
      toast.error("New passwords don't match.");
      return;
    }
    const authUser = firebaseAuth.currentUser;
    if (!authUser?.email) {
      toast.error("You've been signed out. Please sign in again.");
      return;
    }

    setSaving(true);
    try {
      await reauthenticateWithCredential(
        authUser,
        EmailAuthProvider.credential(authUser.email, current),
      );
      await updatePassword(authUser, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password updated");
    } catch (err) {
      toast.error(passwordErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Your account">
      <div id="account" className="flex flex-col gap-5 scroll-mt-24">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{fullName || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium break-all">{user.email}</dd>
          </div>
        </dl>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-black/5 pt-5">
          <p className="text-sm font-medium">Change password</p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_LENGTH}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_LENGTH}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="self-start" disabled={saving}>
            {saving ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </Card>
  );
}
