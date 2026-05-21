import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  description: z.string().min(1, "กรุณาระบุรายละเอียด").max(255),
  date: z.string().min(1, "กรุณาระบุวันที่"),
  categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  note: z.string().max(1000).optional(),
});

export const debtSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อหนี้").max(255),
  creditor: z.string().min(1, "กรุณาระบุเจ้าหนี้").max(255),
  totalAmount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  remainingAmount: z.coerce.number().min(0),
  interestRate: z.coerce.number().min(0).max(100),
  monthlyPayment: z.coerce.number().min(0),
  dueDate: z.string().optional(),
  type: z.enum(["CREDIT_CARD", "LOAN", "BORROW_FROM_PERSON", "OTHER"]),
});

export const debtPaymentSchema = z.object({
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  paymentDate: z.string().min(1, "กรุณาระบุวันที่"),
  note: z.string().max(255).optional(),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "รูปแบบเดือนไม่ถูกต้อง"),
});

export const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณาระบุรหัสผ่าน"),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type DebtInput = z.infer<typeof debtSchema>;
export type DebtPaymentInput = z.infer<typeof debtPaymentSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
