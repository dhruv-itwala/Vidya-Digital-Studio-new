import { z } from "zod";

export const createClientSchema = z
  .object({
    clientName: z.string().min(2, "Client name is required"),
    ownerName: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),

    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Invalid phone number")
      .optional()
      .or(z.literal("")),

    address: z.string().optional(),

    servicesText: z
      .string()
      .min(1, "At least one service is required")
      .refine(
        (val) =>
          val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean).length > 0,
        "Enter valid comma-separated services",
      ),

    billingType: z.enum(["one-time", "monthly"]),

    // 👇 IMPORTANT: no .positive() here
    totalAmount: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number().optional(),
    ),

    monthlyAmount: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number().optional(),
    ),

    tenure: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number().optional(),
    ),

    paymentStatus: z.enum(["paid", "pending", "partial"]).optional(),
    onboardingDate: z.string().optional(),

    transactions: z
      .array(
        z.object({
          date: z.string().optional(),
          amount: z.coerce.number().min(1, "Amount must be greater than 0"),
        }),
      )
      .optional(),

    credentials: z
      .array(
        z.object({
          platform: z.string().optional(),
          username: z.string().optional(),
          password: z.string().optional(),
          note: z.string().optional(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.billingType === "one-time") {
      if (!data.totalAmount || data.totalAmount <= 0) {
        ctx.addIssue({
          path: ["totalAmount"],
          message: "Total amount is required",
        });
      }
    }

    if (data.billingType === "monthly") {
      if (!data.totalAmount || data.totalAmount <= 0) {
        ctx.addIssue({
          path: ["totalAmount"],
          message: "Total amount is required",
        });
      }

      if (!data.monthlyAmount || data.monthlyAmount <= 0) {
        ctx.addIssue({
          path: ["monthlyAmount"],
          message: "Monthly amount is required",
        });
      }

      if (!data.tenure || data.tenure <= 0) {
        ctx.addIssue({
          path: ["tenure"],
          message: "Tenure is required",
        });
      }
    }
  });
