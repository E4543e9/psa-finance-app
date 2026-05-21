export type TransactionType = "INCOME" | "EXPENSE";
export type DebtStatus = "ACTIVE" | "PAID";
export type DebtType = "CREDIT_CARD" | "LOAN" | "BORROW_FROM_PERSON" | "OTHER";

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalDebt: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryExpense {
  name: string;
  amount: number;
  color: string;
  icon: string;
}

export interface TransactionWithCategory {
  id: string;
  type: TransactionType;
  amount: string;
  description: string;
  date: Date;
  note: string | null;
  categoryId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
  };
}

export interface DebtWithPayments {
  id: string;
  name: string;
  creditor: string;
  totalAmount: string;
  remainingAmount: string;
  interestRate: string;
  monthlyPayment: string;
  dueDate: Date | null;
  status: DebtStatus;
  type: DebtType;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  payments: {
    id: string;
    amount: string;
    paymentDate: Date;
    note: string | null;
  }[];
}

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
