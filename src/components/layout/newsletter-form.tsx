"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { newsletterSchema, type NewsletterValues } from "@/lib/validations/misc";

export function NewsletterForm({ className }: { className?: string }) {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: NewsletterValues) {
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      setDone(true);
      toast.success("You're on the list", {
        description: "Look out for early access to the next drop.",
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (done) {
    return (
      <p className={cn("inline-flex items-center gap-2 text-sm", className)}>
        <CheckIcon className="size-4 text-gold-dark" />
        Thanks — check your inbox to confirm.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-2", className)}
      noValidate
    >
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          autoComplete="email"
          {...register("email")}
        />
        <Button type="submit" disabled={isSubmitting} className="shrink-0">
          Subscribe
          <ArrowRightIcon className="size-4" />
        </Button>
      </div>
      {errors.email && (
        <p className="text-xs text-destructive">{errors.email.message}</p>
      )}
    </form>
  );
}
