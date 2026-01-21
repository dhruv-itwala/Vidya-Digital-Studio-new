import { z } from "zod";

export const createClientSchema = z
  .object({
    clientName: z.string().min(2, "Client name is required"),
    ownerName: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
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

    totalAmount: z.coerce.number().optional(),
    monthlyAmount: z.coerce.number().optional(),
    tenure: z.coerce.number().optional(),

    paymentStatus: z.enum(["paid", "pending", "partial"]).optional(),
    onboardingDate: z.string().optional(),
    profilePhoto: z.any().optional(),

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

    documents: z
      .array(
        z.object({
          name: z.string().optional(),
          file: z.any().optional(),
        }),
      )
      .optional()
      .superRefine((docs, ctx) => {
        docs?.forEach((doc, index) => {
          // If file selected → name required
          if (doc.file?.length && !doc.name?.trim()) {
            ctx.addIssue({
              path: [index, "name"],
              message: "Document name required",
            });
          }
        });
      }),
  })
  .superRefine((data, ctx) => {
    // ✅ BILLING LOGIC VALIDATION
    if (data.billingType === "one-time") {
      if (!data.totalAmount) {
        ctx.addIssue({
          path: ["totalAmount"],
          message: "Total amount is required",
        });
      }
    }

    if (data.billingType === "monthly") {
      if (!data.monthlyAmount) {
        ctx.addIssue({
          path: ["monthlyAmount"],
          message: "Monthly amount is required",
        });
      }
      if (!data.tenure) {
        ctx.addIssue({
          path: ["tenure"],
          message: "Tenure is required",
        });
      }
    }
  });
