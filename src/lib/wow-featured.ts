function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const INTRO_PARAGRAPHS = [
  "World of Warcraft is Blizzard Entertainment's long-running MMORPG — two decades of expansions " +
    "built around questing, dungeons, raids, and a persistent world shared with millions of other players.",
  "The content here isn't a full guide to the game. It's a small collection of useful links I've " +
    "gathered while playing, plus a look at The Hidden Lodge, the raiding guild I run with.",
];

export function generateWowIntro(): string {
  const css = `
#wi-root{font-family:inherit;margin:0;}
#wi-root *{box-sizing:border-box;}

.wi-row{display:flex;gap:1.5rem;align-items:center;margin:1rem 0;}
@media (max-width:700px){.wi-row{flex-direction:column;align-items:stretch;}}

.wi-text{flex:1;margin:0;line-height:1.7;color:var(--text,#e8f3ff);}
#wi-root .wi-text p{margin:0 0 1rem;}
#wi-root .wi-text p:last-child{margin-bottom:0;}

.wi-links{flex:0 0 400px;display:flex;flex-direction:column;gap:.75rem;}
@media (max-width:700px){.wi-links{flex-basis:auto;}}

#wi-root a.wi-link{display:flex;align-items:center;gap:.9rem;padding:.9rem 1.1rem;border:1px solid var(--line,#1f2b46);border-left:3px solid var(--accent-2,#ff3fb8);border-radius:8px;background:linear-gradient(90deg,rgb(255 63 184 / 6%) 0%,transparent 60%);text-decoration:none;color:var(--text,#e8f3ff);transition:all .18s ease;}
#wi-root a.wi-link:hover{border-color:var(--accent-2,#ff3fb8);background:linear-gradient(90deg,rgb(255 63 184 / 10%) 0%,transparent 60%);box-shadow:0 0 .8rem rgb(255 63 184 / 15%);text-decoration:none;}

.wi-icon{color:var(--accent-2,#ff3fb8);flex:none;}

.wi-title{font-weight:600;font-size:.95rem;white-space:nowrap;min-width:0;}
@media (max-width:700px){.wi-title{white-space:normal;}}
`;

  return (
    `<div id="wi-root"><style>${css}</style>` +
    `<div class="wi-row">` +
    `<div class="wi-text">${INTRO_PARAGRAPHS.map((p) => `<p>${esc(p)}</p>`).join("")}</div>` +
    `<div class="wi-links">` +
    `<a class="wi-link" href="https://worldofwarcraft.com" target="_blank" rel="noopener noreferrer">` +
    `<svg class="wi-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
    `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>` +
    `</svg>` +
    `<span class="wi-title">Visit the Official World of Warcraft Site ↗</span>` +
    `</a>` +
    `<a class="wi-link" href="/pages/useful-wow-links">` +
    `<svg class="wi-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>` +
    `</svg>` +
    `<span class="wi-title">Useful WoW Links</span>` +
    `</a>` +
    `</div>` +
    `</div>` +
    `</div>`
  );
}

const HIDDEN_LODGE_FACTS: { label: string; value: string }[] = [
  { label: "Realm", value: "Illidan (US)" },
  { label: "Schedule", value: "Thu / Fri, 9:00 PM – 12:00 AM ET" },
  { label: "Focus", value: "Ahead of the Curve → Mythic progression" },
];

export function generateHiddenLodgeFeature(): string {
  const css = `
#hl-root{font-family:inherit;margin:0;}
#hl-root *{box-sizing:border-box;}

.hl-card{position:relative;border:1px solid var(--line,#1f2b46);border-left:3px solid var(--accent,#00e5ff);border-radius:12px;overflow:hidden;background:linear-gradient(160deg,rgb(12 19 36 / 60%) 0%,rgb(17 26 48 / 60%) 100%);margin:1.5rem 0;}

.hl-media{position:absolute;top:0;right:0;bottom:0;width:42%;overflow:hidden;}
@media (max-width:700px){.hl-media{position:static;width:100%;aspect-ratio:16/9;}}

/* The .prose img/h2/ul/p rules in BaseLayout out-specify a bare class, so
   these overrides are scoped by #hl-root to win. */
#hl-root img.hl-img{display:block;width:100%;height:100%;margin:0;border:0;border-radius:0;object-fit:cover;object-position:center 42%;}

.hl-body{padding:1.25rem 1.5rem 1.5rem 1.5rem;margin-right:calc(42% + 1.5rem);}
@media (max-width:700px){.hl-body{margin-right:0;padding:1.25rem 1.25rem 1.5rem;}}

#hl-root h2.hl-title{margin:0 0 .3rem;padding:0;border:0;font-size:1.3rem;font-weight:700;color:var(--text,#e8f3ff);}

#hl-root p.hl-tagline{margin:0 0 1rem;font-size:.85rem;font-style:italic;color:var(--accent,#00e5ff);}

#hl-root p.hl-desc{margin:0 0 1.1rem;line-height:1.7;color:var(--text,#e8f3ff);}

#hl-root ul.hl-facts{display:flex;flex-wrap:wrap;gap:.6rem;margin:0 0 1.2rem;padding:0;list-style:none;}
#hl-root li.hl-fact{display:flex;align-items:baseline;gap:.4rem;margin:0;padding:.4rem .8rem;border:1px solid var(--line,#1f2b46);border-radius:999px;font-size:.8rem;color:var(--muted,#97a8c4);}
.hl-fact strong{color:var(--text,#e8f3ff);font-weight:600;}

#hl-root a.hl-cta{display:inline-flex;align-items:center;gap:.5rem;padding:.7rem 1.2rem;border:1px solid var(--accent,#00e5ff);border-radius:8px;color:var(--accent,#00e5ff);text-decoration:none;font-weight:600;font-size:.9rem;transition:all .18s ease;}
#hl-root a.hl-cta:hover{background:rgb(0 229 255 / 10%);box-shadow:0 0 .8rem rgb(0 229 255 / 15%);text-decoration:none;}
`;

  const factsHtml = HIDDEN_LODGE_FACTS
    .map((f) => `<li class="hl-fact">${esc(f.label)}: <strong>${esc(f.value)}</strong></li>`)
    .join("");

  return (
    `<div id="hl-root"><style>${css}</style>` +
    `<div class="hl-card">` +
    `<div class="hl-media">` +
    `<img class="hl-img" src="/images/hidden-lodge-header.webp" alt="The Hidden Lodge — For Azeroth. For The Hidden Lodge." loading="lazy" />` +
    `</div>` +
    `<div class="hl-body">` +
    `<h2 class="hl-title">The Hidden Lodge</h2>` +
    `<p class="hl-tagline">For Azeroth. For The Hidden Lodge.</p>` +
    `<p class="hl-desc">The Hidden Lodge is the raiding guild I run with — a semi-hardcore crew on Illidan (US) ` +
    `focused on getting Ahead of the Curve each tier before pushing into Mythic progression. We take the game ` +
    `seriously without turning raid night into a second job: lock in during pulls, joke around the rest of the time.</p>` +
    `<ul class="hl-facts">${factsHtml}</ul>` +
    `<a class="hl-cta" href="https://hidden-lodge.com" target="_blank" rel="noopener noreferrer">` +
    `Visit The Hidden Lodge ↗` +
    `</a>` +
    `</div>` +
    `</div>` +
    `</div>`
  );
}
