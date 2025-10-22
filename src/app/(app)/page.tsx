import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // ensure no stale SSG artifact
export const revalidate = 0;

export default function AppRootPage() {
  redirect("/dashboard");
}
