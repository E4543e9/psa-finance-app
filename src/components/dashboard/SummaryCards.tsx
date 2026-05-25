import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
            <CardContent className="p-5">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-8 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const net = data?.netBalance ?? 0;

  const cards = [
    {
      label: "รายรับเดือนนี้",
      value: data?.totalIncome ?? 0,
      color: "text-green-600 dark:text-green-400",
      border: "border-l-4 border-l-green-500",
    },
    {
      label: "รายจ่ายเดือนนี้",
      value: data?.totalExpense ?? 0,
      color: "text-red-600 dark:text-red-400",
      border: "border-l-4 border-l-red-500",
    },
    {
      label: "ยอดสุทธิ",
      value: net,
      color: net >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400",
      border: net >= 0 ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-red-500",
    },
    {
      label: "หนี้คงเหลือรวม",
      value: data?.totalDebt ?? 0,
      color: "text-orange-600 dark:text-orange-400",
      border: "border-l-4 border-l-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className={cn(card.border)}>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {card.label}
            </p>
            <p className={cn("text-2xl font-extrabold tracking-tight", card.color)}>
              ฿{formatCurrency(card.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
