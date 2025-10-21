"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false); const [err,setErr]=useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr(null);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/dashboard" });
    setLoading(false);
    if (res?.error) setErr("Invalid email or password");
    else window.location.href = "/dashboard";
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="text-sm text-slate-600 mt-1">Sign in to your account</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" /></Field>
        <Field label="Password"><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" /></Field>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <Button type="submit" className="w-full">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}</Button>
      </form>
      <div className="mt-4 text-sm">Don't have an account? <Link href="/sign-up" className="underline">Sign up</Link></div>
    </div>
  );
}
function Field({ label, children }: any) {
  return <div><label className="text-sm font-medium">{label}</label><div className="mt-1">{children}</div></div>;
}
