import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, CreditCard } from "lucide-react";

interface SummaryCardsProps {
  data?: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    totalDebt: number;
  };
  loading?: boolean;
}

export function SummaryCards({ data, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "รายรับเดือนนี้",
      value: data?.totalIncome ?? 0,
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "รายจ่ายเดือนนี้",
      value: data?.totalExpense ?? 0,
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950",
    },
    {
      label: "ยอดสุทธิ",
      value: data?.netBalance ?? 0,
      icon: Wallet,
      color: (data?.netBalance ?? 0) >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "หนี้คงเหลือรวม",
      value: data?.totalDebt ?? 0,
      icon: CreditCard,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon size={16} className={card.color} />
                </div>
              </div>
              <p className={`text-xl font-bold ${card.color}`}>
                {formatCurrency(card.value)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
