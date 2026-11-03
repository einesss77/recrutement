"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Slide = { id: string; title: string; html: string };
export default function Presentation({ slides, printAll = false }: { slides: Slide[]; printAll?: boolean }) {
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const move = useCallback((offset: number) => setActive(value => Math.max(0, Math.min(slides.length - 1, value + offset))), [slides.length]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input,textarea,select,[contenteditable]")) return;
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") { event.preventDefault(); move(1); }
      if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); move(-1); }
      if (event.key === "Home") { event.preventDefault(); setActive(0); }
      if (event.key === "End") { event.preventDefault(); setActive(slides.length - 1); }
    };
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("fullscreenchange", onFullscreen); };
  }, [move, slides.length]);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (root.current?.requestFullscreen) await root.current.requestFullscreen();
      else setMessage("Le plein écran n’est pas disponible sur ce navigateur. Tournez votre appareil pour une vue plus large.");
    } catch { setMessage("Le plein écran n’est pas disponible ici. La présentation reste utilisable."); }
  }
  return <main ref={root} className={"bv bv-present" + (printAll ? " bv-print-all" : "")}>
    <h1 className="bv-sr">B&M — Présentation de l’organisation et du plan 90 jours</h1>
    <header className="bv-present-top"><Link href="/admin/organisation">← Vue d’ensemble</Link><div className="bv-control-group"><a download className="bv-button" href="/admin/organisation/presentation/export?format=pdf">Télécharger le PDF ↓</a><a download className="bv-button" href="/admin/organisation/presentation/export?format=html">Slides hors ligne ↓</a></div></header>
    <div className="bv-frame">{slides.map((slide, i) => <section key={slide.id} className="bv-slide" aria-label={(i + 1) + " sur " + slides.length + " · " + slide.title} hidden={!printAll && i !== active} dangerouslySetInnerHTML={{__html:slide.html}} />)}</div>
    <div className="bv-present-controls">
      <div className="bv-control-group"><button onClick={() => move(-1)} disabled={active === 0} aria-label="Slide précédente">← Précédente</button><span className="bv-counter" aria-live="polite">{active + 1} / {slides.length}</span><button onClick={() => move(1)} disabled={active === slides.length - 1} aria-label="Slide suivante">Suivante →</button></div>
      <nav className="bv-progress" aria-label="Choisir une slide">{slides.map((slide,i) => <button key={slide.id} onClick={() => setActive(i)} aria-label={(i + 1) + " · " + slide.title} aria-current={i === active ? "true" : undefined} />)}</nav>
      <button onClick={toggleFullscreen}>{fullscreen ? "Quitter le plein écran" : "Plein écran ⤢"}</button>
    </div>
    <p className="bv-present-help">Flèches ← → ou boutons pour naviguer · Sur mobile, tournez l’appareil pour agrandir les slides.<br />Support interne de discussion · Les rémunérations individuelles restent dans le document complet.</p>
    {message && <p className="bv-error" role="status">{message}</p>}
    <noscript><p className="bv-nojs">Activez JavaScript pour naviguer ou téléchargez le PDF avec le lien ci-dessus.</p></noscript>
  </main>;
}
