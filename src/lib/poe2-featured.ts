interface FeaturedItem {
  title: string;
  description: string;
  href: string;
  iconSvg: string;
}

const ITEMS: FeaturedItem[] = [
  {
    title: "Atlas Farming Strategies",
    description: "Curated endgame Atlas strategies for efficient mapping and farming.",
    href: "/pages/atlas-farming-strategies",
    iconSvg: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  },
  {
    title: "Expedition Rumours Cheat Sheet",
    description: "Quick reference for which Expedition rumours are safe to detonate with Aldur's Bloodmark.",
    href: "/pages/expedition-rumours-cheat-sheet",
    iconSvg: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  },
  {
    title: "Useful POE2 Links",
    description: "A running list of bookmarked tools, trackers, and resources for Path of Exile 2.",
    href: "/pages/useful-poe2-links",
    iconSvg: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  },
];

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generatePoe2Featured(): string {
  const itemsHtml = ITEMS.map((item) => (
    `<a class="pf-card" href="${esc(item.href)}">` +
    `<svg class="pf-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.iconSvg}</svg>` +
    `<span class="pf-title">${esc(item.title)}</span>` +
    `<span class="pf-desc">${esc(item.description)}</span>` +
    `</a>`
  )).join("");

  const css = `
#pf-root{font-family:inherit;margin:0;}
#pf-root *{box-sizing:border-box;}

.pf-label{font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#97a8c4);margin:1.25rem 0 .6rem;}

.pf-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin:0;}
@media (max-width:768px){.pf-grid{grid-template-columns:1fr 1fr;}}
@media (max-width:520px){.pf-grid{grid-template-columns:1fr;}}

.pf-card{display:flex;flex-direction:column;gap:.6rem;padding:1.1rem;border:1px solid var(--line,#1f2b46);border-radius:12px;background:linear-gradient(160deg,rgb(12 19 36 / 60%) 0%,rgb(17 26 48 / 60%) 100%);text-decoration:none;color:var(--text,#e8f3ff);transition:all .2s ease;}
.pf-card:hover{border-color:var(--accent,#00e5ff);box-shadow:0 0 1rem rgb(0 229 255 / 15%);transform:translateY(-2px);}

.pf-icon{color:var(--accent,#00e5ff);flex:none;}

.pf-title{font-weight:600;font-size:1rem;}

.pf-desc{color:var(--muted,#97a8c4);font-size:.85rem;line-height:1.5;}
`;

  return `<div id="pf-root"><style>${css}</style><p class="pf-label">On This Site</p><div class="pf-grid">${itemsHtml}</div></div>`;
}

const INTRO_TEXT =
  "Path of Exile 2 is Grinding Gear Games' free-to-play action RPG, the sequel to the original " +
  "Path of Exile — deep skill and passive systems, brutal combat, and an evolving endgame built " +
  "around the Atlas.";

export function generatePoe2Intro(): string {
  const css = `
#pi-root{font-family:inherit;margin:0;}
#pi-root *{box-sizing:border-box;}

.pi-row{display:flex;gap:1.5rem;align-items:flex-start;margin:1rem 0;}
@media (max-width:700px){.pi-row{flex-direction:column;align-items:stretch;}}

.pi-text{flex:1;margin:0;line-height:1.7;color:var(--text,#e8f3ff);}

.pi-link{flex:0 0 400px;display:flex;align-items:center;gap:.9rem;padding:.9rem 1.1rem;border:1px solid var(--line,#1f2b46);border-left:3px solid var(--accent-2,#ff3fb8);border-radius:8px;background:linear-gradient(90deg,rgb(255 63 184 / 6%) 0%,transparent 60%);text-decoration:none;color:var(--text,#e8f3ff);transition:all .18s ease;}
@media (max-width:700px){.pi-link{flex-basis:auto;}}
.pi-link:hover{border-color:var(--accent-2,#ff3fb8);background:linear-gradient(90deg,rgb(255 63 184 / 10%) 0%,transparent 60%);box-shadow:0 0 .8rem rgb(255 63 184 / 15%);}

.pi-icon{color:var(--accent-2,#ff3fb8);flex:none;}

.pi-title{font-weight:600;font-size:.95rem;white-space:nowrap;min-width:0;}
@media (max-width:700px){.pi-title{white-space:normal;}}
`;

  return (
    `<div id="pi-root"><style>${css}</style>` +
    `<div class="pi-row">` +
    `<p class="pi-text">${esc(INTRO_TEXT)}</p>` +
    `<a class="pi-link" href="https://pathofexile2.com" target="_blank" rel="noopener noreferrer">` +
    `<svg class="pi-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>` +
    `</svg>` +
    `<span class="pi-title">Visit the Official Path of Exile 2 Site ↗</span>` +
    `</a>` +
    `</div>` +
    `</div>`
  );
}
