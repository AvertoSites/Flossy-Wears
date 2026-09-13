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

export const checkoutSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  marketingOptIn: z.boolean(),
  ...addressSchema.shape,
  shippingMethodId: z.string().min(1, "Choose a delivery method"),
});

export const paymentSchema = z.object({
  cardName: z.string().min(1, "Name on card is required"),
  cardNumber: z
    .string()
    .min(1, "Card number is required")
    .regex(/^[\d\s]{12,23}$/, "Enter a valid card number"),
  expiry: z
    .string()
    .min(1, "Expiry is required")
    .regex(/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/, "Use MM / YY"),
  cvc: z
    .string()
    .min(1, "Security code is required")
    .regex(/^\d{3,4}$/, "3 or 4 digits"),
});

export type AddressValues = z.infer<typeof addressSchema>;
export type PaymentValues = z.infer<typeof paymentSchema>;
export type CheckoutValues = z.infer<typeof checkoutSchema>;
