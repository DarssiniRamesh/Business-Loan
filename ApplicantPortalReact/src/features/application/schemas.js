import { z } from "zod";

export const businessSchema = z.object({
  legalName: z.string().min(2, "Business legal name is required"),
  dbaName: z.string().optional().or(z.literal("")),
  ein: z
    .string()
    .min(9, "EIN must be 9 digits")
    .max(10, "EIN must be 9 digits")
    .regex(/^\d{2}-?\d{7}$/, "EIN format: 12-3456789"),
  industry: z.string().min(2, "Industry is required"),
  yearsInBusiness: z.coerce.number().min(0, "Invalid").max(100, "Invalid"),
  annualRevenue: z.coerce.number().min(0, "Invalid"),
  addressLine1: z.string().min(2, "Address is required"),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  postalCode: z.string().min(5, "ZIP required").max(10, "ZIP invalid")
});

export const ownerSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Email invalid"),
  phone: z.string().min(7, "Phone required"),
  ssnLast4: z.string().regex(/^\d{4}$/, "Last 4 SSN required"),
  ownershipPct: z.coerce.number().min(0, "Invalid").max(100, "Invalid")
});

export const loanSchema = z.object({
  amountRequested: z.coerce.number().min(1000, "Minimum $1,000").max(5000000, "Maximum $5,000,000"),
  purpose: z.string().min(3, "Purpose required"),
  termMonths: z.coerce.number().min(6, "Min 6 months").max(240, "Max 240 months")
});

export const wizardDraftSchema = z.object({
  business: businessSchema.partial(),
  owner: ownerSchema.partial(),
  loan: loanSchema.partial()
});
