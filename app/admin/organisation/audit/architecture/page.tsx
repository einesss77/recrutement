import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import Architecture from "./Architecture";

export const metadata: Metadata = {
  title: "Architecture des audits IA — B&M",
  description: "Agents, compétences, infrastructure, processus et interventions humaines du système d’audit B&M.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ArchitecturePage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  return <Architecture />;
}
