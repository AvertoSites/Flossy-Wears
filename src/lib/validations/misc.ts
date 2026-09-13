import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Please add a little more detail"),
});

export type NewsletterValues = z.infer<typeof newsletterSchema>;
export type ContactValues = z.infer<typeof contactSchema>;
