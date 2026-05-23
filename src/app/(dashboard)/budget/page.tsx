"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalDebt: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface AdviceItem {
  icon: string;
  title: string;
  desc: string;
  type: "good" | "warn" | "danger" | "info";
}

function generateAdvice(summary: SummaryData, monthly: MonthlyData[]): AdviceItem[] {
  const advice: AdviceItem[] = [];
  const { totalIncome, totalExpense, netBalance, totalDebt } = summary;

  // savings rate
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 100;

  if (savingsRate >= 20) {
    advice.push({
      icon: "🏆",
      title: "ออมเงินได้ดีมาก!",
      desc: `คุณออมได้ ${savingsRate.toFixed(1)}% ของรายรับ ซึ่งสูงกว่าเป้าหมาย 20% ต่อเดือน ยอดเยี่ยม`,
      type: "good",
    });
  } else if (savingsRate > 0) {
    advice.push({
      icon: "💡",
      title: "ปรับการออมให้ดีขึ้น",
      desc: `ออมได้ ${savingsRate.toFixed(1)}% ลองตั้งเป้าที่ 20% = ${formatCurrency(totalIncome * 0.2)} ต่อเดือน`,
      type: "warn",
    });
  } else if (totalIncome > 0) {
    advice.push({
      icon: "🚨",
      title: "รายจ่ายเกินรายรับ",
      desc: `ขณะนี้ใช้จ่ายเกินกว่ารายรับ ${formatCurrency(Math.abs(netBalance))} ควรลดรายจ่ายที่ไม่จำเป็นทันที`,
      type: "danger",
    });
  }

  // 50/30/20 rule
  const needs = totalIncome * 0.5;
  const wants = totalIncome * 0.3;
  const savings = totalIncome * 0.2;

  if (totalIncome > 0) {
    advice.push({
      icon: "📊",
      title: "กฎ 50/30/20",
      desc: `รายรับ ${formatCurrency(totalIncome)} → สิ่งจำเป็น ${formatCurrency(needs)} · ความต้องการ ${formatCurrency(wants)} · ออม/ลงทุน ${formatCurrency(savings)}`,
      type: "info",
    });
  }

  // debt ratio
  if (totalDebt > 0 && totalIncome > 0) {
    const monthlyDebtRatio = (totalDebt / (totalIncome * 12)) * 100;
    if (monthlyDebtRatio > 50) {
      advice.push({
        icon: "⚠️",
        title: "หนี้อยู่ในระดับสูง",
        desc: `ยอดหนี้รวม ${formatCurrency(totalDebt)} คิดเป็น ${monthlyDebtRatio.toFixed(0)}% ของรายรับต่อปี ควรเร่งชำระหนี้ที่ดอกเบี้ยสูงก่อน`,
        type: "danger",
      });
    } else {
      advice.push({
        icon: "🎯",
        title: "บริหารหนี้",
        desc: `ยอดหนี้รวม ${formatCurrency(totalDebt)} ควรชำระ snowball (หนี้น้อยสุดก่อน) หรือ avalanche (ดอกเบี้ยสูงสุดก่อน)`,
        type: "info",
      });
    }
  }

  // emergency fund
  const monthlyExpAvg = monthly.length > 0
    ? monthly.slice(-3).reduce((s, m) => s + m.expense, 0) / Math.min(3, monthly.filter((m) => m.expense > 0).length || 1)
    : totalExpense;
  const emergencyTarget = monthlyExpAvg * 6;

  advice.push({
    icon: "🛡️",
    title: "เงินสำรองฉุกเฉิน",
    desc: `ควรมีเงินสำรอง 6 เดือน = ${formatCurrency(emergencyTarget)} จากค่าเฉลี่ยรายจ่าย 3 เดือนล่าสุด`,
    type: "info",
  });

  // spending trend
  if (monthly.length >= 2) {
    const last = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    if (last.expense > prev.expense * 1.2) {
      advice.push({
        icon: "📈",
        title: "รายจ่ายเพิ่มขึ้นผิดปกติ",
        desc: `เดือนนี้ใช้จ่าย ${formatCurrency(last.expense)} เพิ่มจากเดือนก่อน ${((last.expense / prev.expense - 1) * 100).toFixed(0)}% ลองตรวจสอบรายการว่ามีอะไรที่ลดได้`,
        type: "warn",
      });
    } else if (last.expense < prev.expense * 0.9 && prev.expense > 0) {
      advice.push({
        icon: "📉",
        title: "รายจ่ายลดลงดี",
        desc: `เดือนนี้ใช้จ่ายลดลงจากเดือนก่อน ${((1 - last.expense / prev.expense) * 100).toFixed(0)}% ทำได้ดี`,
        type: "good",
      });
    }
  }

  // investment tip
  if (savingsRate >= 15) {
    advice.push({
      icon: "📈",
      title: "ถึงเวลาลงทุน",
      desc: "ออมได้ดีแล้ว ลองพิจารณา RMF/SSF ลดภาษี หรือกองทุนรวม/หุ้นระยะยาวเพื่อเพิ่มผลตอบแทน",
      type: "good",
    });
  }

  return advice;
}

const typeStyle: Record<string, string> = {
  good: "border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/30",
  warn: "border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/30",
  danger: "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/30",
  info: "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30",
};

const tips = [
  { icon: "🧾", text: "บันทึกทุกรายจ่าย แม้แต่เล็กน้อย — ผลรวมมักทำให้ตกใจ" },
  { icon: "🔄", text: "ทบทวนสมาชิก subscription ทุกเดือน ยกเลิกที่ไม่ได้ใช้" },
  { icon: "🛒", text: "ทำลิสต์ก่อนซื้อของ ลดการซื้อแบบไม่ตั้งใจ" },
  { icon: "💳", text: "ชำระบัตรเครดิตเต็มจำนวนทุกเดือน หลีกเลี่ยงดอกเบี้ย" },
  { icon: "📅", text: "ตั้งการโอนออมอัตโนมัติทันทีที่เงินเดือนเข้า" },
  { icon: "🎯", text: "ตั้งเป้าหมายการเงินที่ชัดเจน เช่น เก็บเงินดาวน์บ้าน หรือเที่ยว" },
  { icon: "📊", text: "เปรียบเทียบราคาก่อนซื้อสินค้าราคาสูง ไม่ตัดสินใจเร็ว" },
  { icon: "🍱", text: "ทำอาหารกินเองอย่างน้อย 3-4 วันต่อสัปดาห์ ประหยัดได้มาก" },
];

export default function BudgetPage() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then((d) => {
        setSummaryData(d.summary);
        setMonthlyData(d.monthlyData ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const advice = summaryData ? generateAdvice(summaryData, monthlyData) : [];
  const randomTips = [...tips].sort(() => 0.5 - Math.random()).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight hidden lg:block">คำแนะนำการเงิน</h1>
        <p className="text-sm text-muted-foreground mt-1">วิเคราะห์จากข้อมูลจริงของคุณ</p>
      </div>

      {/* Summary snapshot */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : summaryData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "รายรับเดือนนี้", value: summaryData.totalIncome, color: "text-green-600 dark:text-green-400", border: "border-l-4 border-l-green-500" },
            { label: "รายจ่ายเดือนนี้", value: summaryData.totalExpense, color: "text-red-600 dark:text-red-400", border: "border-l-4 border-l-red-500" },
            { label: "ยอดสุทธิ", value: summaryData.netBalance, color: summaryData.netBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600", border: "border-l-4 border-l-blue-500" },
            { label: "หนี้รวม", value: summaryData.totalDebt, color: "text-orange-600 dark:text-orange-400", border: "border-l-4 border-l-orange-500" },
          ].map((s) => (
            <Card key={s.label} className={s.border}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                <p className={cn("text-xl font-extrabold", s.color)}>{formatCurrency(s.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Personalized advice */}
      <div>
        <h2 className="text-base font-bold mb-3">การวิเคราะห์เฉพาะตัวคุณ</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : advice.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              เพิ่มข้อมูลรายรับ-รายจ่ายก่อน เพื่อรับคำแนะนำที่ตรงกับสถานการณ์ของคุณ
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {advice.map((item, i) => (
              <Card key={i} className={cn(typeStyle[item.type])}>
                <CardContent className="p-4 flex gap-3 items-start">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-bold text-sm">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* General tips */}
      <div>
        <h2 className="text-base font-bold mb-3">เคล็ดลับการเงินประจำวัน</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {randomTips.map((tip, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex gap-3 items-start">
                <span className="text-xl flex-shrink-0">{tip.icon}</span>
                <p className="text-sm leading-relaxed">{tip.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 50/30/20 reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">หลักการแบ่งเงิน 50/30/20</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { pct: "50%", label: "สิ่งจำเป็น", desc: "ค่าเช่า ค่าอาหาร ค่าเดินทาง", color: "text-blue-600 dark:text-blue-400" },
              { pct: "30%", label: "ความต้องการ", desc: "บันเทิง ช้อปปิ้ง ท่องเที่ยว", color: "text-purple-600 dark:text-purple-400" },
              { pct: "20%", label: "ออม/ชำระหนี้", desc: "เงินออม กองทุน ชำระหนี้", color: "text-green-600 dark:text-green-400" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-muted/40">
                <p className={cn("text-3xl font-extrabold", s.color)}>{s.pct}</p>
                <p className="font-bold text-sm mt-1">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
