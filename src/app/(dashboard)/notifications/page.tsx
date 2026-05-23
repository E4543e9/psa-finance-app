"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Bell, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface SplitRequest {
  id: string;
  amount: string;
  description: string;
  status: string;
  createdAt: string;
  fromUser?: { userId: string; name: string };
  toUser?: { userId: string; name: string };
}

export default function NotificationsPage() {
  const [incoming, setIncoming] = useState<SplitRequest[]>([]);
  const [outgoing, setOutgoing] = useState<SplitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/split-requests");
    const data = await res.json();
    setIncoming(data.incoming ?? []);
    setOutgoing(data.outgoing ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function respond(id: string, action: "APPROVED" | "REJECTED") {
    setResponding(id);
    const res = await fetch(`/api/split-requests/${id}/respond`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      toast.success(action === "APPROVED" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว");
      fetchData();
    } else toast.error("เกิดข้อผิดพลาด");
    setResponding(null);
  }

  const pendingCount = incoming.filter((r) => r.status === "PENDING").length;

  const statusBadge = (status: string) => {
    if (status === "PENDING") return <Badge variant="warning" className="text-xs">รอดำเนินการ</Badge>;
    if (status === "APPROVED") return <Badge variant="success" className="text-xs">อนุมัติแล้ว</Badge>;
    return <Badge variant="destructive" className="text-xs">ปฏิเสธแล้ว</Badge>;
  };

  const list = tab === "incoming" ? incoming : outgoing;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">การแจ้งเตือน</h1>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
              {pendingCount}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">คำขอแบ่งค่าใช้จ่าย</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("incoming")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === "incoming"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowDownLeft size={15} />
          คำขอที่ได้รับ
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("outgoing")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === "outgoing"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowUpRight size={15} />
          คำขอที่ส่ง
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-muted-foreground text-sm py-8 text-center">กำลังโหลด...</p>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">ไม่มีรายการ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <Card key={r.id} className={r.status === "PENDING" && tab === "incoming" ? "border-amber-200 dark:border-amber-800" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm">{r.description}</p>
                      {statusBadge(r.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tab === "incoming"
                        ? `จาก ${r.fromUser?.name} (@${r.fromUser?.userId})`
                        : `ถึง ${r.toUser?.name} (@${r.toUser?.userId})`
                      }
                      {" · "}
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: th })}
                    </p>
                  </div>
                  <p className="text-base font-bold text-red-500 whitespace-nowrap">
                    {formatCurrency(parseFloat(r.amount))}
                  </p>
                </div>

                {r.status === "PENDING" && tab === "incoming" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                      disabled={responding === r.id}
                      onClick={() => respond(r.id, "REJECTED")}
                    >
                      <XCircle size={14} />
                      ปฏิเสธ
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={responding === r.id}
                      onClick={() => respond(r.id, "APPROVED")}
                    >
                      <CheckCircle2 size={14} />
                      อนุมัติ
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
