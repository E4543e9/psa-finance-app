import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  description: z.string().min(1, "กรุณาระบุรายละเอียด").max(255),
  date: z.string().min(1, "กรุณาระบุวันที่"),
  categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  note: z.string().max(1000).optional(),
  paidTo: z.string().max(255).optional(),
  splitWith: z.string().max(255).optional(),
  splitAmount: z.coerce.number().min(0).optional(),
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

export const monthlyBillSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อบิล").max(255),
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  dueDay: z.coerce.number().int().min(1).max(31),
  categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  paidTo: z.string().max(255).optional(),
  note: z.string().max(255).optional(),
});

export const billPaymentSchema = z.object({
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "รูปแบบเดือนไม่ถูกต้อง"),
  status: z.enum(["PAID", "WAITING_REFUND"]),
  paidDate: z.string().min(1, "กรุณาระบุวันที่"),
  note: z.string().max(255).optional(),
});

export const loginSchema = z.object({
  userId: z.string().min(1, "กรุณาระบุ ID"),
});

export const registerSchema = z.object({
  userId: z.string().min(3, "ID ต้องมีอย่างน้อย 3 ตัวอักษร").max(50).regex(/^[a-zA-Z0-9_]+$/, "ID ใช้ได้เฉพาะ a-z, A-Z, 0-9, _"),
  name: z.string().min(1, "กรุณาระบุชื่อ").max(100),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type DebtInput = z.infer<typeof debtSchema>;
export type DebtPaymentInput = z.infer<typeof debtPaymentSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type MonthlyBillInput = z.infer<typeof monthlyBillSchema>;
export type BillPaymentInput = z.infer<typeof billPaymentSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
