"use client";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const [name,setName]=useState(""); const [email,setEmail]=useState("");
  const [password,setPassword]=useState(""); const [err,setErr]=useState<string|null>(null);
  const [ok,setOk]=useState(false); const [loading,setLoading]=useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!res.ok) { const j = await res.json().catch(()=>null); setErr(j?.error ?? "Failed to create account"); return; }
    setOk(true);
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Create an account</h1>
        <p className="text-sm text-slate-600 mt-1">It's quick and painless.</p>
      </div>

      {ok ? (
        <div className="rounded-xl border p-4 bg-white/70">Account created! <Link href="/sign-in" className="underline">Sign in</Link></div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name"><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" /></Field>
          <Field label="Email"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" /></Field>
          <Field label="Password"><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" /></Field>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <Button type="submit" className="w-full">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Create Account"}</Button>
        </form>
      )}

      <div className="mt-4 text-sm">Already have an account? <Link href="/sign-in" className="underline">Log in</Link></div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div><label className="text-sm font-medium">{label}</label><div className="mt-1">{children}</div></div>;
}
