interface LinkItem {
  label: string;
  href: string;
  iconSvg: string;
  filled?: boolean;
}

const MUSIC_LINKS: LinkItem[] = [
  {
    label: "Spotify",
    href: "https://open.spotify.com/artist/0LwtEDzdDXRarZ1H4eLqnU",
    filled: true,
    iconSvg: '<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.32-1.32 9.719-.66 13.439 1.62.361.181.54.78.301 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.72-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>',
  },
  {
    label: "Apple Music",
    href: "https://music.apple.com/us/artist/pneumaris/1896511324",
    iconSvg: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  },
  {
    label: "SoundCloud",
    href: "https://soundcloud.com/pneumaris",
    iconSvg: '<line x1="4" y1="16" x2="4" y2="8"/><line x1="8" y1="19" x2="8" y2="5"/><line x1="12" y1="17" x2="12" y2="7"/><line x1="16" y1="15" x2="16" y2="9"/><line x1="20" y1="13" x2="20" y2="11"/>',
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@Pneumaris",
    filled: true,
    iconSvg: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
  },
];

const SOCIAL_LINKS: LinkItem[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/pneumaris/",
    iconSvg: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/>',
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61589446647657",
    filled: true,
    iconSvg: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@pneumaris",
    iconSvg: '<polygon points="5 3 19 12 5 21 5 3"/>',
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/pneumarisband",
    iconSvg: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  },
];

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function iconSvg(item: LinkItem): string {
  return item.filled
    ? `<svg class="pn-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">${item.iconSvg}</svg>`
    : `<svg class="pn-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.iconSvg}</svg>`;
}

function renderGrid(items: LinkItem[]): string {
  return items.map((item) => (
    `<a class="pn-card" href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">` +
    iconSvg(item) +
    `<span class="pn-label">${esc(item.label)}</span>` +
    `</a>`
  )).join("");
}

export function generatePneumarisLinks(): string {
  const css = `
#pn-root{font-family:inherit;margin:0;}
#pn-root *{box-sizing:border-box;}

.pn-official{display:flex;align-items:center;gap:.9rem;padding:.9rem 1.1rem;border:1px solid var(--line,#1f2b46);border-left:3px solid var(--accent-2,#ff3fb8);border-radius:8px;background:linear-gradient(90deg,rgb(255 63 184 / 6%) 0%,transparent 60%);text-decoration:none;color:var(--text,#e8f3ff);transition:all .18s ease;margin:0 0 1.25rem;}
.pn-official:hover{border-color:var(--accent-2,#ff3fb8);background:linear-gradient(90deg,rgb(255 63 184 / 10%) 0%,transparent 60%);box-shadow:0 0 .8rem rgb(255 63 184 / 15%);}
.pn-official-icon{color:var(--accent-2,#ff3fb8);flex:none;}
.pn-official-title{font-weight:600;font-size:.95rem;}

.pn-label{display:block;font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#97a8c4);margin:0 0 .6rem;}

.pn-group{margin-bottom:1.25rem;}
.pn-group:last-child{margin-bottom:0;}

.pn-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;}
@media (max-width:700px){.pn-grid{grid-template-columns:repeat(2,1fr);}}
@media (max-width:420px){.pn-grid{grid-template-columns:1fr;}}

.pn-card{display:flex;flex-direction:column;align-items:center;gap:.5rem;padding:1rem .75rem;border:1px solid var(--line,#1f2b46);border-radius:10px;background:linear-gradient(160deg,rgb(12 19 36 / 60%) 0%,rgb(17 26 48 / 60%) 100%);text-decoration:none;color:var(--text,#e8f3ff);transition:all .2s ease;text-align:center;}
.pn-card:hover{border-color:var(--accent,#00e5ff);box-shadow:0 0 1rem rgb(0 229 255 / 15%);transform:translateY(-2px);}

.pn-icon{color:var(--accent,#00e5ff);flex:none;}
`;

  // Overwrite .pn-label used inside cards (link name) to a non-uppercase style;
  // the group heading also uses .pn-label but as a block-level element above the grid.
  const cardLabelOverride = `
.pn-card .pn-label{font-size:.82rem;font-weight:600;letter-spacing:normal;text-transform:none;color:var(--text,#e8f3ff);margin:0;}
`;

  return (
    `<div id="pn-root"><style>${css}${cardLabelOverride}</style>` +
    `<a class="pn-official" href="https://pneumarisband.com/" target="_blank" rel="noopener noreferrer">` +
    `<svg class="pn-official-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>` +
    `</svg>` +
    `<span class="pn-official-title">Visit the Official Pneumaris Site ↗</span>` +
    `</a>` +
    `<div class="pn-group"><span class="pn-label">Music</span><div class="pn-grid">${renderGrid(MUSIC_LINKS)}</div></div>` +
    `<div class="pn-group"><span class="pn-label">Social</span><div class="pn-grid">${renderGrid(SOCIAL_LINKS)}</div></div>` +
    `</div>`
  );
}
