"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    const saved = localStorage.getItem("psa_saved_userId");
    if (saved) {
      setValue("userId", saved);
      setRemember(true);
    }
  }, [setValue]);

  async function onSubmit(data: LoginInput) {
    setLoading(true);

    if (remember) {
      localStorage.setItem("psa_saved_userId", data.userId);
    } else {
      localStorage.removeItem("psa_saved_userId");
    }

    const res = await signIn("credentials", {
      userId: data.userId,
      redirect: false,
    });

    if (res?.error) {
      toast.error("ไม่พบ ID นี้ในระบบ");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "hsl(30 11% 5%)" }}
    >
      <div className="w-full max-w-sm psa-fade">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "hsl(16 100% 64% / 0.15)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" style={{ color: "#FF6E48" }}>
              <path d="M12 3L21 8V16L12 21L3 16V8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M12 3V21M3 8L21 8M3 16L21 16" stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "hsl(42 25% 90%)" }}>psa<span style={{ color: "#FF6E48" }}>.</span></h1>
          <p className="text-sm mt-1" style={{ color: "hsl(40 8% 45%)" }}>finance, made calm</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: "hsl(30 8% 9%)", border: "1px solid hsl(30 8% 16%)" }}>
          <h2 className="font-semibold text-base mb-0.5" style={{ color: "hsl(42 25% 90%)" }}>เข้าสู่ระบบ</h2>
          <p className="text-xs mb-5" style={{ color: "hsl(40 8% 45%)" }}>ใช้ ID ที่ตั้งไว้ตอนสมัครสมาชิก</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(40 8% 55%)" }}>ID</label>
              <input
                {...register("userId")}
                type="text"
                autoComplete="username"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "hsl(30 6% 13%)",
                  border: "1px solid hsl(30 8% 20%)",
                  color: "hsl(42 25% 90%)",
                }}
                placeholder="กรอก ID ของคุณ"
                onFocus={(e) => (e.target.style.borderColor = "#FF6E48")}
                onBlur={(e) => (e.target.style.borderColor = "hsl(30 8% 20%)")}
              />
              {errors.userId && (
                <p className="mt-1 text-xs" style={{ color: "hsl(8 100% 69%)" }}>{errors.userId.message}</p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: "#FF6E48" }}
              />
              <span className="text-xs" style={{ color: "hsl(40 8% 45%)" }}>จำ ID ด้วยเครื่องนี้</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 font-semibold text-sm rounded-xl transition-opacity disabled:opacity-50"
              style={{ background: "#FF6E48", color: "hsl(43 14% 7%)" }}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "hsl(40 8% 45%)" }}>
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="font-medium transition-opacity hover:opacity-80" style={{ color: "#FF6E48" }}>
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
}
