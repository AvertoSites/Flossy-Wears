import { z } from "zod";

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

export const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "Town or city is required"),
  county: z.string().optional(),
  postcode: z
    .string()
    .min(1, "Postcode is required")
    .regex(UK_POSTCODE, "Enter a valid UK postcode"),
  country: z.string().min(1, "Country is required"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^[\d\s+()-]{7,}$/, "Enter a valid phone number"),
});

export type AddressValues = z.infer<typeof addressSchema>;
