import { z } from "zod";
import {
  UK_COUNTRY,
  formatUkPhone,
  formatUkPostcode,
  isDeliverableUkPostcode,
  isUkCountry,
  isValidUkPhone,
  isValidUkPostcode,
} from "@/lib/validations/uk-address";

const NAME = /^[\p{L}][\p{L}\s'’.-]*$/u;
const TOWN = /^[\p{L}][\p{L}\s'’.,-]*$/u;

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} is too long`)
    .regex(NAME, `Enter a valid ${label.toLowerCase()}`);

const optionalLine = z
  .string()
  .trim()
  .max(100, "Keep this under 100 characters")
  .optional();

/**
 * Delivery addresses are UK-only (Royal Mail). Postcodes and phone numbers
 * are validated against UK formats and normalised on the way out, so every
 * saved address reads "SW1A 1AA" / "07700900123" / "United Kingdom"
 * regardless of how the customer typed it.
 */
export const addressSchema = z.object({
  firstName: name("First name"),
  lastName: name("Last name"),
  line1: z
    .string()
    .trim()
    .min(3, "Enter your house number and street")
    .max(100, "Keep this under 100 characters"),
  line2: optionalLine,
  city: z
    .string()
    .trim()
    .min(2, "Town or city is required")
    .max(50, "Town or city is too long")
    .regex(TOWN, "Enter a valid town or city"),
  county: optionalLine,
  postcode: z
    .string()
    .trim()
    .min(1, "Postcode is required")
    .refine(isValidUkPostcode, "Enter a valid UK postcode, e.g. SW1A 1AA")
    .refine(
      isDeliverableUkPostcode,
      "We can't deliver to the Channel Islands, Isle of Man or BFPO addresses yet",
    )
    .transform(formatUkPostcode),
  country: z
    .string()
    .trim()
    .refine(isUkCountry, "We only deliver within the United Kingdom")
    .transform(() => UK_COUNTRY),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .refine(isValidUkPhone, "Enter a valid UK phone number, e.g. 07700 900123")
    .transform(formatUkPhone),
});

/** What the form holds while the customer types. */
export type AddressInput = z.input<typeof addressSchema>;
/** What gets saved — trimmed and normalised. */
export type AddressValues = z.output<typeof addressSchema>;
