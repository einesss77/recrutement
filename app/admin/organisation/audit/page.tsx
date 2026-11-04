import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { auditCss, auditSlides, renderAuditSlide } from "@/lib/bmAuditVisual";
import { strategyCss } from "@/lib/bmStrategyStyles";
import Presentation from "../presentation/Presentation";

export const metadata: Metadata = {title:"B&M — Comprendre le processus d’audit IA",robots:{index:false,follow:false}};
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  return <><style>{strategyCss + auditCss}</style><Presentation audit slides={auditSlides.map((slide,index) => ({id:slide.id,title:slide.title,html:renderAuditSlide(slide,index)}))} /></>;
}
