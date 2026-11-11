const lineIcon = paths => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const people = lineIcon('<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5"/>');
const code = lineIcon('<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>');
const direction = lineIcon('<path d="M5 21V4m0 0h13l-3 4 3 4H5"/>');
const arrow = lineIcon('<path d="M5 19 19 5M5 5h14v14"/>');

export function renderHomeConnection() {
  return `<section class="hc-connection" aria-labelledby="hc-title" data-home-connection>
    <div class="wrap hc-layout">
      <div class="hc-intro" data-kh-reveal>
        <p class="kh-eyebrow">LE BON FORMAT, AUTOUR DE VOUS</p>
        <h2 id="hc-title">Un projet.<br><span>Les bonnes connexions.</span></h2>
        <p>Des experts, un produit, ou les deux.<br>À chaque besoin, son accompagnement.</p>
        <div class="hc-controls" role="group" aria-label="Choisir votre accompagnement" hidden>
          <button type="button" data-hc-mode="team" aria-pressed="false" aria-controls="hc-diagram">Renforcer<br>mon équipe</button>
          <button type="button" data-hc-mode="product" aria-pressed="false" aria-controls="hc-diagram">Créer<br>un produit</button>
          <button type="button" data-hc-mode="both" aria-pressed="true" aria-controls="hc-diagram">Combiner<br>les deux</button>
        </div>
        <a class="hc-link" href="/contact/" data-hc-link>Trouvons le bon format ${arrow}</a>
      </div>
      <figure class="hc-board" id="hc-diagram" data-hc-board data-mode="both" data-running="false" aria-labelledby="hc-board-label" data-kh-reveal>
        <div class="hc-board-top"><span id="hc-board-label">VOTRE PROJET, BIEN ENTOURÉ</span><span class="hc-board-index" aria-hidden="true">B&M / 03</span></div>
        <div class="hc-inputs">
          <div class="hc-input">${people}<span data-hc-input="0">Experts IT</span></div>
          <div class="hc-input">${code}<span data-hc-input="1">Design & code</span></div>
          <div class="hc-input">${direction}<span data-hc-input="2">Pilotage</span></div>
        </div>
        <svg class="hc-flow" viewBox="0 0 600 54" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <g class="hc-flow-track"><path d="M100 0v13q0 14 14 14h172q14 0 14 14v13"/><path d="M300 0v54"/><path d="M500 0v13q0 14-14 14H314q-14 0-14 14v13"/></g>
          <g class="hc-flow-current"><path d="M100 0v13q0 14 14 14h172q14 0 14 14v13"/><path d="M300 0v54"/><path d="M500 0v13q0 14-14 14H314q-14 0-14 14v13"/></g>
        </svg>
        <div class="hc-hub"><span class="hc-hub-symbol" aria-hidden="true">${lineIcon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7m-3.5-3.5v7"/>')}</span><div><strong data-hc-title>Votre projet</strong><span data-hc-subtitle>Un cap commun</span></div><i aria-hidden="true"></i></div>
        <div class="hc-outcome-line" aria-hidden="true"></div>
        <figcaption class="hc-result" aria-live="polite" aria-atomic="true"><span data-hc-result>Une équipe et un produit qui avancent ensemble.</span></figcaption>
      </figure>
    </div>
  </section>`;
}
