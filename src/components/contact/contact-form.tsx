"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/common/text-field";
import { contactSchema, type ContactValues } from "@/lib/validations/misc";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit() {
    await new Promise((r) => setTimeout(r, 500));
    setSent(true);
    toast.success("Message sent", {
      description: "We'll reply within one working day.",
    });
  }

  if (sent) {
    return (
      <p className="inline-flex items-center gap-2 rounded-md border border-border bg-cream/50 px-4 py-3 text-sm">
        <CheckIcon className="size-4 text-gold-dark" />
        Thanks — your message is on its way.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" error={errors.name} {...register("name")} />
        <TextField
          label="Email"
          type="email"
          error={errors.email}
          {...register("email")}
        />
      </div>
      <TextField label="Subject" error={errors.subject} {...register("subject")} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={5} aria-invalid={!!errors.message} {...register("message")} />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message.message}</p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
