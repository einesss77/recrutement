import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { renderSlide, strategySlides } from "@/lib/bmStrategyVisual";
import { strategyCss } from "@/lib/bmStrategyStyles";
import Presentation from "./Presentation";

export const metadata:Metadata={title:"B&M — Présentation & plan 90 jours",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<{print?:string}>}) {
  if(!(await isAdminAuthenticated()))redirect("/admin");
  const {print}=await searchParams;
  return <><style>{strategyCss}</style><Presentation printAll={print==="1"} slides={strategySlides.map((slide,index)=>({id:slide.id,title:slide.title,html:renderSlide(slide,index)}))}/></>;
}
