"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: data.userId, name: data.name }),
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "สมัครสมาชิกไม่สำเร็จ");
    } else {
      toast.success("สมัครสมาชิกสำเร็จ");
      router.push("/login");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#060614" }}>
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <linearGradient id="rtop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="rleft" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
                <linearGradient id="rright" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
              <polygon points="32,4 56,18 32,32 8,18" fill="url(#rtop)" />
              <polygon points="8,18 32,32 32,56 8,42" fill="url(#rleft)" />
              <polygon points="56,18 32,32 32,56 56,42" fill="url(#rright)" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">PSA Finance</h1>
          <p className="text-sm text-gray-400 mt-1">ระบบจัดการการเงินส่วนตัว</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{ background: "#0f1117", border: "1px solid #1e2130" }}>
          <h2 className="text-white font-semibold text-base mb-1">สมัครสมาชิก</h2>
          <p className="text-gray-500 text-xs mb-5">ตั้ง ID สำหรับเข้าสู่ระบบ</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">ID (ใช้สำหรับเข้าสู่ระบบ)</label>
              <input
                {...register("userId")}
                type="text"
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                style={{ background: "#1a1d2e", border: "1px solid #2a2d3e" }}
                placeholder="เช่น E4543e9"
              />
              <p className="mt-1 text-xs text-gray-600">ตัวอักษร a-z, A-Z, 0-9, _ อย่างน้อย 3 ตัว</p>
              {errors.userId && (
                <p className="mt-0.5 text-xs text-red-400">{errors.userId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">ชื่อ</label>
              <input
                {...register("name")}
                type="text"
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                style={{ background: "#1a1d2e", border: "1px solid #2a2d3e" }}
                placeholder="ชื่อของคุณ"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-white font-semibold text-sm rounded-lg transition-opacity disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3b82f6 100%)" }}
            >
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-5">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
