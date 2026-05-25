import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  description: string;
  date: string | Date;
  category: { name: string; icon: string | null };
}

interface RecentTransactionsProps {
  data?: Transaction[];
  loading?: boolean;
}

export function RecentTransactions({ data, loading }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ธุรกรรมล่าสุด</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีรายการ</p>
        ) : (
          <div className="space-y-3">
            {data.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-base">
                  {t.category.icon ?? "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category.name} · {formatDate(t.date)}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold whitespace-nowrap ${
                    t.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "-"}฿
                  {formatCurrency(parseFloat(t.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
