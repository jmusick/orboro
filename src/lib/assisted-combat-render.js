/**
 * Shared render logic for the Assisted Combat analysis widget.
 *
 * This module is consumed twice. `assisted-combat-analysis.ts` imports it
 * normally to server-render the initial view, and also inlines its source
 * (via a `?raw` import) into the browser script so the client re-renders with
 * byte-identical markup instead of a second, drifting copy of the templates.
 *
 * Because of that, keep this file plain, dependency-free ES module JS whose
 * only top-level statements are `export function` / `export var`: the client
 * wrapper strips the `export ` keywords with a regex and evaluates the rest
 * inside an IIFE. No imports, no DOM access, no side effects.
 */

export var CLASS_COLORS = {
  "Death Knight": "#c41e3a",
  "Demon Hunter": "#a330c9",
  Druid: "#ff7c0a",
  Evoker: "#33937f",
  Hunter: "#aad372",
  Mage: "#3fc7eb",
  Monk: "#00ff98",
  Paladin: "#f48cba",
  Priest: "#f5f5f5",
  Rogue: "#fff468",
  Shaman: "#0070dd",
  Warlock: "#8788ee",
  Warrior: "#c69b6d",
};

export var FALLBACK_CLASS_COLOR = "#00e5ff";

export var DETAIL_TABS = [
  ["missing", "Versus SimC"],
  ["apl", "Blizzard APL"],
  ["icy", "Icy Veins"],
  ["ptr", "PTR change"],
];

/** Never emit `undefined` into a custom property: it silently kills color-mix(). */
export function classColor(gameClass) {
  return CLASS_COLORS[gameClass] || FALLBACK_CLASS_COLOR;
}

export function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function titleAction(value) {
  return String(value)
    .split("_")
    .map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

export function initials(value) {
  return String(value)
    .split(/\s+/)
    .map(function (part) {
      return part.charAt(0);
    })
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function specKey(spec) {
  return spec.gameClass + "|" + spec.spec;
}

/** `ptrSteps` is omitted from the payload when it is identical to `liveSteps`. */
export function ptrStepsOf(spec) {
  return spec.ptrSteps || spec.liveSteps;
}

/**
 * Spec icons are vendored under /images/wow-spec-icons/ by
 * scripts/fetch-spec-icons.mjs. Falls back to the spec's initials when a spec
 * has no mapped icon, so a missing entry degrades instead of showing a broken
 * image. The name is filtered to listfile-safe characters because it lands in
 * a URL, not just in text.
 */
export function specIconMarkup(spec) {
  var icon = spec.icon ? String(spec.icon).replace(/[^a-z0-9_-]/gi, "") : "";
  if (!icon) {
    return '<span class="ac-monogram" aria-hidden="true">' + escapeHtml(initials(spec.spec)) + "</span>";
  }
  return (
    '<img class="ac-monogram ac-monogram--art" src="/images/wow-spec-icons/' +
    icon +
    '.jpg" alt="" width="38" height="38" loading="lazy" decoding="async">'
  );
}

export function infoIcon(text) {
  return (
    '<span class="ac-info" role="note" tabindex="0" aria-label="' +
    escapeHtml(text) +
    '" data-tooltip="' +
    escapeHtml(text) +
    '">i</span>'
  );
}

export function blizzardMatchInfo(spec) {
  return (
    spec.sharedActionCount +
    " of " +
    spec.blizzardActionCount +
    " distinct Blizzard actions also appear in SimC. Blizzard match equals shared actions divided by Blizzard actions."
  );
}

export function simcCoverageInfo(spec) {
  return (
    spec.sharedActionCount +
    " of " +
    spec.simcActionCount +
    " distinct SimC actions are represented by Blizzard. SimC covered equals shared actions divided by SimC actions."
  );
}

export function profilesInfo(spec) {
  if (!spec.simcProfiles || !spec.simcProfiles.length) return "No SimC profile was matched to this specialization.";
  return (
    "Executable action lines in each matched SimC profile: " +
    spec.simcProfiles
      .map(function (profile, index) {
        return profile + " (" + spec.simcActionLines[index] + ")";
      })
      .join(", ") +
    "."
  );
}

// Both lists are curated from the research writeup, not the raw set difference:
// only 3 of 31 specs match the computed diff exactly, 12 are hand-trimmed
// subsets, and 16 mix in logic items. Say so rather than implying it is derived.
export var MISSING_ACTIONS_INFO =
  "Actions SimulationCraft's optimized profile uses that Blizzard's priority list does not. "
  + "Hand-curated from the full set difference: entries judged immaterial, such as pet summons and utility, are omitted, "
  + "so this list is narrower than the computed diff behind the Comparison context numbers.";

export var MISSING_LOGIC_INFO =
  "Decision logic SimulationCraft applies that Blizzard's priority list does not: talent branches, cooldown timing, "
  + "resource thresholds, and target selection. Curated from the research writeup rather than computed from the action lists.";

export function bulletList(items, empty) {
  if (!items || !items.length) return '<p class="ac-muted ac-muted--flush">' + escapeHtml(empty) + "</p>";
  return (
    '<ul class="ac-list">' +
    items
      .map(function (item) {
        return '<li class="ac-list-item">' + escapeHtml(item) + "</li>";
      })
      .join("") +
    "</ul>"
  );
}

export function defaultState(payload) {
  return {
    search: "",
    gameClass: "all",
    role: "all",
    ptrOnly: false,
    selected: payload.specs.length ? specKey(payload.specs[0]) : "",
    tab: "missing",
    build: "live",
  };
}

/** Everything a free-text search should be able to reach, including APL actions. */
export function searchHaystack(spec) {
  return [
    spec.gameClass,
    spec.spec,
    spec.role,
    spec.alignment,
    spec.missingActions.join(" "),
    spec.missingLogic.join(" "),
    spec.comparisonLimitation.join(" "),
    spec.ptrChange,
    spec.ptrAssessment,
    spec.icySummary,
    spec.icyRating,
    spec.liveSteps
      .concat(ptrStepsOf(spec))
      .map(function (step) {
        return step.action;
      })
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

export function filterSpecs(payload, state) {
  var needle = state.search.trim().toLowerCase();
  return payload.specs.filter(function (spec) {
    if (state.gameClass !== "all" && spec.gameClass !== state.gameClass) return false;
    if (state.role !== "all" && spec.role !== state.role) return false;
    if (state.ptrOnly && !spec.ptrChanged) return false;
    if (!needle) return true;
    return searchHaystack(spec).indexOf(needle) !== -1;
  });
}

export function findSpec(payload, key) {
  for (var i = 0; i < payload.specs.length; i++) {
    if (specKey(payload.specs[i]) === key) return payload.specs[i];
  }
  return null;
}

export function renderCards(specs, state) {
  return specs
    .map(function (spec) {
      var selected = specKey(spec) === state.selected;
      var scores = spec.simcComparable
        ? '<span class="ac-score-line"><span>Blizzard match</span><strong>' +
          spec.overlap +
          "%" +
          infoIcon(blizzardMatchInfo(spec)) +
          "</strong></span>" +
          '<span class="ac-score-line ac-score-line--simc"><span>SimC covered</span><strong>' +
          spec.simcCoverage +
          "%" +
          infoIcon(simcCoverageInfo(spec)) +
          "</strong></span>"
        : '<span class="ac-score-na">N/A</span>';
      return (
        '<button type="button" class="ac-spec-card" data-spec-key="' +
        escapeHtml(specKey(spec)) +
        '" aria-pressed="' +
        (selected ? "true" : "false") +
        '" style="--class-color:' +
        classColor(spec.gameClass) +
        '">' +
        specIconMarkup(spec) +
        '<span><span class="ac-spec-name">' +
        escapeHtml(spec.spec) +
        '</span><span class="ac-class-name">' +
        escapeHtml(spec.gameClass) +
        " · " +
        escapeHtml(spec.role) +
        "</span></span>" +
        '<span class="ac-card-meta">' +
        scores +
        (spec.ptrChanged ? '<span class="ac-ptr-dot" title="Changed on PTR"></span>' : "") +
        "</span>" +
        "</button>"
      );
    })
    .join("");
}

export function renderSteps(spec, state) {
  var steps = state.build === "ptr" ? ptrStepsOf(spec) : spec.liveSteps;
  return steps
    .map(function (step) {
      return (
        '<div class="ac-step' +
        (step.automationOnly ? " ac-step--automation" : "") +
        '">' +
        '<span class="ac-step__priority">' +
        step.priority +
        "</span>" +
        '<span class="ac-step__action">' +
        escapeHtml(step.action) +
        (step.automationOnly ? '<span class="ac-auto">Automation only</span>' : "") +
        '<span class="ac-step__ids">spell ' +
        (step.spellId == null ? "not available" : step.spellId) +
        " · step " +
        step.stepId +
        "</span></span>" +
        '<span class="ac-step__condition">' +
        escapeHtml(step.condition) +
        "</span>" +
        "</div>"
      );
    })
    .join("");
}

function renderMissingPanel(spec) {
  if (!spec.simcComparable) {
    return (
      '<section class="ac-block"><h4 class="ac-block-title">Not directly comparable</h4>' +
      bulletList(
        spec.comparisonLimitation,
        "SimulationCraft does not provide an equivalent optimized profile for this role/spec."
      ) +
      '<p class="ac-muted">The Blizzard list is still shown in the APL tab, but the directional action scores are intentionally omitted.</p></section>'
    );
  }
  return (
    '<div class="ac-panel-grid">' +
    '<section class="ac-block"><h4 class="ac-block-title">In SimC, not in Blizzard\'s list' +
    infoIcon(MISSING_ACTIONS_INFO) +
    "</h4>" +
    bulletList(spec.missingActions, "No material missing actions identified in the curated comparison.") +
    "</section>" +
    '<section class="ac-block"><h4 class="ac-block-title">Logic SimC applies that Blizzard doesn\'t' +
    infoIcon(MISSING_LOGIC_INFO) +
    "</h4>" +
    bulletList(spec.missingLogic, "No additional missing logic was called out.") +
    "</section>" +
    '<section class="ac-block ac-block--wide"><h4 class="ac-block-title">Comparison context</h4><div class="ac-metric-row">' +
    '<div class="ac-mini-metric"><span class="ac-mini-value ac-mini-value--match">' +
    spec.overlap +
    "%" +
    infoIcon(blizzardMatchInfo(spec)) +
    '</span><span class="ac-mini-label">Blizzard actions found in SimC · ' +
    spec.sharedActionCount +
    " / " +
    spec.blizzardActionCount +
    "</span></div>" +
    '<div class="ac-mini-metric"><span class="ac-mini-value ac-mini-value--coverage">' +
    spec.simcCoverage +
    "%" +
    infoIcon(simcCoverageInfo(spec)) +
    '</span><span class="ac-mini-label">SimC actions represented by Blizzard · ' +
    spec.sharedActionCount +
    " / " +
    spec.simcActionCount +
    "</span></div>" +
    '<div class="ac-mini-metric"><span class="ac-mini-value">' +
    spec.liveSteps.length +
    '</span><span class="ac-mini-label">Blizzard live priority steps</span></div>' +
    '<div class="ac-mini-metric"><span class="ac-mini-value">' +
    escapeHtml(spec.simcActionLines.join(" / ")) +
    infoIcon(profilesInfo(spec)) +
    '</span><span class="ac-mini-label">SimC lines by profile</span></div>' +
    "</div>" +
    (spec.blizzardOnlyActions.length
      ? '<p class="ac-muted">Blizzard-only or fallback action names: ' +
        escapeHtml(spec.blizzardOnlyActions.map(titleAction).join(", ")) +
        ".</p>"
      : "") +
    "</section>" +
    "</div>"
  );
}

function renderAplPanel(spec, payload, state) {
  return (
    '<div class="ac-build-switch" role="group" aria-label="APL build">' +
    '<button type="button" class="ac-build" data-apl-build="live" aria-pressed="' +
    (state.build === "live") +
    '">Live ' +
    escapeHtml(payload.liveBuild) +
    " · " +
    spec.liveSteps.length +
    " steps</button>" +
    '<button type="button" class="ac-build" data-apl-build="ptr" aria-pressed="' +
    (state.build === "ptr") +
    '">PTR ' +
    escapeHtml(payload.ptrBuild) +
    " · " +
    ptrStepsOf(spec).length +
    " steps</button>" +
    '</div><p class="ac-apl-note">Priority 1 is evaluated first. Every condition shown on a step must pass; “automation only” entries are internal cooldown actions and are not part of Assisted Highlight.</p><div class="ac-apl">' +
    renderSteps(spec, state) +
    "</div>"
  );
}

function renderIcyPanel(spec) {
  return (
    '<section class="ac-block"><h4 class="ac-block-title">Guide alignment</h4><span class="ac-rating" data-rating="' +
    escapeHtml(spec.icyRating) +
    '">' +
    escapeHtml(spec.icyRating) +
    '</span><p class="ac-copy">' +
    escapeHtml(spec.icySummary || "No guide comparison summary is available.") +
    "</p>" +
    (spec.icyUrl
      ? '<a class="ac-cta" href="' +
        escapeHtml(spec.icyUrl) +
        '" target="_blank" rel="noopener noreferrer">Open Icy Veins guide <span aria-hidden="true">↗</span></a>'
      : "") +
    "</section>"
  );
}

function renderPtrPanel(spec) {
  var ptrCopy = spec.ptrChanged
    ? spec.ptrChange
    : "No Blizzard APL data changes between the pinned live and PTR builds.";
  return (
    '<div class="ac-panel-grid"><section class="ac-block"><h4 class="ac-block-title">Blizzard change</h4><p class="ac-copy">' +
    escapeHtml(ptrCopy) +
    "</p></section>" +
    '<section class="ac-block"><h4 class="ac-block-title">Relationship to SimulationCraft</h4><p class="ac-copy">' +
    escapeHtml(spec.ptrAssessment || spec.ptrNotes.join(" ") || "No material change to assess.") +
    "</p></section>" +
    '<section class="ac-block ac-block--wide"><h4 class="ac-block-title">Guide and PTR coverage note</h4><p class="ac-copy">' +
    escapeHtml(spec.icyPtrEffect || "No guide-facing effect was identified.") +
    '</p><p class="ac-muted">True SimC MID2 profile: ' +
    (spec.hasTruePtrProfile ? "yes" : "no; comparison uses source/APL support only") +
    ".</p></section></div>"
  );
}

export function renderDetail(spec, payload, state) {
  var panels = {
    missing: renderMissingPanel(spec),
    apl: renderAplPanel(spec, payload, state),
    icy: renderIcyPanel(spec),
    ptr: renderPtrPanel(spec),
  };
  var tabs = DETAIL_TABS.map(function (tab) {
    var isSelected = state.tab === tab[0];
    return (
      '<button type="button" class="ac-tab" role="tab" id="ac-tab-' +
      tab[0] +
      '" aria-controls="ac-panel-' +
      tab[0] +
      '" aria-selected="' +
      isSelected +
      '" tabindex="' +
      (isSelected ? "0" : "-1") +
      '" data-detail-tab="' +
      tab[0] +
      '">' +
      tab[1] +
      "</button>"
    );
  }).join("");
  var panelMarkup = DETAIL_TABS.map(function (tab) {
    return (
      '<div class="ac-panel" role="tabpanel" id="ac-panel-' +
      tab[0] +
      '" aria-labelledby="ac-tab-' +
      tab[0] +
      '" tabindex="0" data-panel="' +
      tab[0] +
      '"' +
      (state.tab === tab[0] ? "" : " hidden") +
      ">" +
      panels[tab[0]] +
      "</div>"
    );
  }).join("");

  return (
    '<div class="ac-detail-head"><div><p class="ac-detail-kicker">' +
    escapeHtml(spec.gameClass) +
    " · " +
    escapeHtml(spec.role) +
    '</p><h3 class="ac-detail-title">' +
    escapeHtml(spec.spec) +
    '</h3></div><div class="ac-badges">' +
    '<span class="ac-badge">Spec ' +
    spec.specId +
    '</span><span class="ac-badge">APL ' +
    spec.assistedCombatId +
    "</span>" +
    (spec.alignment ? '<span class="ac-badge">' + escapeHtml(spec.alignment) + "</span>" : "") +
    (spec.simcComparable
      ? '<span class="ac-badge ac-badge--overlap">' +
        spec.overlap +
        "%" +
        infoIcon(blizzardMatchInfo(spec)) +
        ' Blizzard match</span><span class="ac-badge ac-badge--coverage">' +
        spec.simcCoverage +
        "%" +
        infoIcon(simcCoverageInfo(spec)) +
        " SimC represented</span>"
      : '<span class="ac-badge">Not SimC-comparable</span>') +
    (spec.ptrChanged ? '<span class="ac-badge ac-badge--ptr">PTR changed</span>' : "") +
    "</div></div>" +
    '<div class="ac-tabs" role="tablist" aria-label="' +
    escapeHtml(spec.spec + " " + spec.gameClass) +
    ' analysis sections">' +
    tabs +
    "</div>" +
    panelMarkup
  );
}

/** Short, stable sentence for the polite status region — never the whole panel. */
export function statusMessage(spec, state, shown, total) {
  var tabLabel = "";
  for (var i = 0; i < DETAIL_TABS.length; i++) {
    if (DETAIL_TABS[i][0] === state.tab) tabLabel = DETAIL_TABS[i][1];
  }
  return (
    shown + " of " + total + " specs listed. Showing " + spec.spec + " " + spec.gameClass + ", " + tabLabel + "."
  );
}
