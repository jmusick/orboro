-- Approved copy-editing sweeps 1–5 and humanizer revisions.
-- Updates existing articles only; preserves titles, dates, authors, categories, and images.
-- Safe to re-run: already matching bodies keep their updated_at timestamp.

-- Could Jev Power the Next WoWAnalyzer?
UPDATE content
SET markdown = 'After a bad raid pull, the useful question is rarely just “How much damage did we do?” It is “What should we change before the next attempt?”

[WoWAnalyzer](https://github.com/WoWAnalyzer/WoWAnalyzer) helps players improve through performance metrics and gameplay suggestions. [Wipefest](https://www.wipefest.gg/) turns Warcraft Logs reports into raid-mechanic insights and timelines. That helps a player or raid leader decide what to change before the next pull.

Could Jev, a specialized AI decision model, help build an alternative to these tools? It could provide an interpretation layer, provided a combat-log engine supplies the facts and maintained game rules support each recommendation.

## What Jev brings to the problem

Jev is TypeSafe AI''s model for bounded decisions. Give it relevant context and a question with a defined answer space, and it returns a structured result your application can consume. TypeSafe calls this a System One model. [Introduction](https://docs.typesafe.ai/introduction)

Jev has three question types. Choice selects from named alternatives. Score rates something across descriptive levels. Noul returns the probability that a yes/no statement is true. Choice and Score also include probability distributions and a confidence statistic.

For a WoW tool, these might become:

- Choice: does a delayed cooldown look like a missed opportunity, deliberate alignment, or an unclear case?
- Score: how actionable is this finding under a defined review rubric?
- Noul: does the supplied evidence support checking an interrupt assignment?

Vercel reported that Jev reached nearly 13% of AI Gateway''s paid teams within its first day. That is an adoption signal, not evidence that it can analyze WoW correctly. [Vercel''s launch report](https://vercel.com/blog/ai-gateway-jev-model-launch)

## Build the fight model first

Sending an entire combat log with “tell me what went wrong” would leave too much work to the model.

A rotation analyzer needs to reconstruct casts, buffs, resources, cooldown availability, and target availability. It also needs patch-specific rules for the player''s spec, talents, and encounter. Holding a cooldown can be sensible if a damage window is approaching; an apparent cast gap can be explained by forced downtime.

A raid analyzer needs encounter phases, mechanic definitions, assignments where available, and the sequence before a pull becomes unrecoverable. Later deaths can be consequences of an earlier failure. A log alone may not establish why someone made a decision.

The proposed pipeline is:

Combat events → deterministic reconstruction → candidate findings → Jev classification → evidence-linked feedback.

Code should calculate durations, count casts, and enforce known rules. Jev receives compact findings with the relevant rule attached. This also follows TypeSafe''s guidance to filter state before evaluating it. [State design](https://docs.typesafe.ai/concepts/state)

## Example: reviewing a delayed cooldown

Suppose the parser finds a long delay before a major offensive cooldown. Rather than immediately mark it as a mistake, a second layer could classify the context.

Install `@typesafe-ai/sdk`, set `TYPESAFE_API_KEY` in your server environment, and run the following as an `.mjs` file using Node.js 20 or newer. The SDK reads the key automatically. [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)

```js
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

// Synthetic fixture: these fields come from our own analysis engine.
// They are not raw Warcraft Logs API fields or measured results.
const finding = {
  kind: "delayed_offensive_cooldown",
  delay: "Long enough to lose a use before the fight ends",
  playerAlive: true,
  targetAvailable: true,
  forcedDowntime: false,
  plannedHold: false,
  rule: "Use while a target is available unless holding for a documented window.",
  evidenceIds: ["cooldown-ready-1", "next-cast-1", "fight-end-1"],
};

const { answers } = await client.systemOne({
  model: "jev-1.13.0",
  state: finding,
  questions: {
    interpretation: choice(
      "Which interpretation is best supported by this finding and its rule?",
      {
        missed_opportunity: "Usable cooldown delayed without a documented reason",
        justified_hold: "Evidence supports holding for a planned window or downtime",
        insufficient_context: "Missing or conflicting evidence prevents classification",
      },
    ),
  },
});

console.log(answers.interpretation);
```

The API call depends on the analysis that precedes it. The fixture assumes the engine has determined whether another use was possible, supplied target availability, and attached a reviewed rule. Keep unknown information marked as unknown; converting it to `false` changes the evidence.

Jev''s answer is an interpretation of that evidence. It is not a simulation of the damage another cast would have produced. Estimating a DPS loss requires additional modeling.

## Example: suggesting a raid investigation

For raid analysis, ask which investigation the evidence supports. Avoid asking the model to name the player who caused the wipe.

Here is a separate request using another synthetic fixture:

```js
const raidReview = await client.systemOne({
  model: "jev-1.13.0",
  state: {
    firstDeath: "Tank died immediately after an interruptible cast completed",
    interrupts: "No successful interrupt recorded for that cast",
    mechanicRule: "This cast must be interrupted under the selected strategy",
    assignment: "Unknown",
    evidenceIds: ["cast-complete-7", "death-8"],
  },
  questions: {
    next_check: choice("What should the raid leader investigate first?", {
      interrupt_plan: "Check assignments and interrupt availability for this cast",
      defensive_plan: "Check mitigation if evidence points to expected damage",
      more_context: "The evidence does not support a specific investigation",
    }),
  },
});

console.log(raidReview.answers.next_check);
```

“Review the interrupt assignment at this timestamp” is a useful lead. “Player X wiped the raid” requires much stronger evidence. A production tool would retain links to the relevant cast and death events so someone can verify the finding.

## Turn decisions into controlled feedback

A model-selected label should not automatically become a definitive coaching tip. Choice confidence describes the returned distribution; it is not a guarantee of correctness. [Confidence reference](https://docs.typesafe.ai/confidence)

```js
const decision = answers.interpretation;
const threshold = 0.85; // Illustrative; tune on expert-reviewed examples.

const review =
  decision.choice === "insufficient_context" || decision.confidence < threshold
    ? { status: "needs_review", evidenceIds: finding.evidenceIds }
    : {
        status: "suggested_interpretation",
        label: decision.choice,
        evidenceIds: finding.evidenceIds,
      };

console.log(review);
```

The UI could map labels to reviewed explanation templates. A generative model could write richer summaries later, constrained to verified findings. Jev itself is not designed to write those explanations.

## Could this replace WoWAnalyzer or Wipefest?

A new product could compete with them, but Jev would supply only part of the system. It would still need report ingestion, correct event reconstruction, spec and encounter knowledge, useful timelines, and ongoing patch maintenance.

The potential benefit is a reusable interpretation layer: the same interface could review cooldown findings, mechanic failures, and conflicting evidence. Test it against deterministic rules to see whether it improves accuracy or reduces maintenance.

TypeSafe documents limitations involving arithmetic, indirect questions, irrelevant context, and adversarial input. Typed outputs do not remove those problems. [Known limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13)

I would start with one spec, one encounter, and a labeled collection of findings reviewed by experienced players. Measure incorrect advice and unnecessary review alongside latency and cost. Show the source evidence for every suggestion.

Jev could help select an interpretation, but the analysis engine still has to establish the facts. I would judge the prototype by how often experienced players agree with its advice and can verify it from the linked events.',
    updated_at = 1790789991154
WHERE slug = 'could-jev-power-the-next-wowanalyzer' AND page_type = 'post' AND status = 'published'
  AND markdown <> 'After a bad raid pull, the useful question is rarely just “How much damage did we do?” It is “What should we change before the next attempt?”

[WoWAnalyzer](https://github.com/WoWAnalyzer/WoWAnalyzer) helps players improve through performance metrics and gameplay suggestions. [Wipefest](https://www.wipefest.gg/) turns Warcraft Logs reports into raid-mechanic insights and timelines. That helps a player or raid leader decide what to change before the next pull.

Could Jev, a specialized AI decision model, help build an alternative to these tools? It could provide an interpretation layer, provided a combat-log engine supplies the facts and maintained game rules support each recommendation.

## What Jev brings to the problem

Jev is TypeSafe AI''s model for bounded decisions. Give it relevant context and a question with a defined answer space, and it returns a structured result your application can consume. TypeSafe calls this a System One model. [Introduction](https://docs.typesafe.ai/introduction)

Jev has three question types. Choice selects from named alternatives. Score rates something across descriptive levels. Noul returns the probability that a yes/no statement is true. Choice and Score also include probability distributions and a confidence statistic.

For a WoW tool, these might become:

- Choice: does a delayed cooldown look like a missed opportunity, deliberate alignment, or an unclear case?
- Score: how actionable is this finding under a defined review rubric?
- Noul: does the supplied evidence support checking an interrupt assignment?

Vercel reported that Jev reached nearly 13% of AI Gateway''s paid teams within its first day. That is an adoption signal, not evidence that it can analyze WoW correctly. [Vercel''s launch report](https://vercel.com/blog/ai-gateway-jev-model-launch)

## Build the fight model first

Sending an entire combat log with “tell me what went wrong” would leave too much work to the model.

A rotation analyzer needs to reconstruct casts, buffs, resources, cooldown availability, and target availability. It also needs patch-specific rules for the player''s spec, talents, and encounter. Holding a cooldown can be sensible if a damage window is approaching; an apparent cast gap can be explained by forced downtime.

A raid analyzer needs encounter phases, mechanic definitions, assignments where available, and the sequence before a pull becomes unrecoverable. Later deaths can be consequences of an earlier failure. A log alone may not establish why someone made a decision.

The proposed pipeline is:

Combat events → deterministic reconstruction → candidate findings → Jev classification → evidence-linked feedback.

Code should calculate durations, count casts, and enforce known rules. Jev receives compact findings with the relevant rule attached. This also follows TypeSafe''s guidance to filter state before evaluating it. [State design](https://docs.typesafe.ai/concepts/state)

## Example: reviewing a delayed cooldown

Suppose the parser finds a long delay before a major offensive cooldown. Rather than immediately mark it as a mistake, a second layer could classify the context.

Install `@typesafe-ai/sdk`, set `TYPESAFE_API_KEY` in your server environment, and run the following as an `.mjs` file using Node.js 20 or newer. The SDK reads the key automatically. [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)

```js
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

// Synthetic fixture: these fields come from our own analysis engine.
// They are not raw Warcraft Logs API fields or measured results.
const finding = {
  kind: "delayed_offensive_cooldown",
  delay: "Long enough to lose a use before the fight ends",
  playerAlive: true,
  targetAvailable: true,
  forcedDowntime: false,
  plannedHold: false,
  rule: "Use while a target is available unless holding for a documented window.",
  evidenceIds: ["cooldown-ready-1", "next-cast-1", "fight-end-1"],
};

const { answers } = await client.systemOne({
  model: "jev-1.13.0",
  state: finding,
  questions: {
    interpretation: choice(
      "Which interpretation is best supported by this finding and its rule?",
      {
        missed_opportunity: "Usable cooldown delayed without a documented reason",
        justified_hold: "Evidence supports holding for a planned window or downtime",
        insufficient_context: "Missing or conflicting evidence prevents classification",
      },
    ),
  },
});

console.log(answers.interpretation);
```

The API call depends on the analysis that precedes it. The fixture assumes the engine has determined whether another use was possible, supplied target availability, and attached a reviewed rule. Keep unknown information marked as unknown; converting it to `false` changes the evidence.

Jev''s answer is an interpretation of that evidence. It is not a simulation of the damage another cast would have produced. Estimating a DPS loss requires additional modeling.

## Example: suggesting a raid investigation

For raid analysis, ask which investigation the evidence supports. Avoid asking the model to name the player who caused the wipe.

Here is a separate request using another synthetic fixture:

```js
const raidReview = await client.systemOne({
  model: "jev-1.13.0",
  state: {
    firstDeath: "Tank died immediately after an interruptible cast completed",
    interrupts: "No successful interrupt recorded for that cast",
    mechanicRule: "This cast must be interrupted under the selected strategy",
    assignment: "Unknown",
    evidenceIds: ["cast-complete-7", "death-8"],
  },
  questions: {
    next_check: choice("What should the raid leader investigate first?", {
      interrupt_plan: "Check assignments and interrupt availability for this cast",
      defensive_plan: "Check mitigation if evidence points to expected damage",
      more_context: "The evidence does not support a specific investigation",
    }),
  },
});

console.log(raidReview.answers.next_check);
```

“Review the interrupt assignment at this timestamp” is a useful lead. “Player X wiped the raid” requires much stronger evidence. A production tool would retain links to the relevant cast and death events so someone can verify the finding.

## Turn decisions into controlled feedback

A model-selected label should not automatically become a definitive coaching tip. Choice confidence describes the returned distribution; it is not a guarantee of correctness. [Confidence reference](https://docs.typesafe.ai/confidence)

```js
const decision = answers.interpretation;
const threshold = 0.85; // Illustrative; tune on expert-reviewed examples.

const review =
  decision.choice === "insufficient_context" || decision.confidence < threshold
    ? { status: "needs_review", evidenceIds: finding.evidenceIds }
    : {
        status: "suggested_interpretation",
        label: decision.choice,
        evidenceIds: finding.evidenceIds,
      };

console.log(review);
```

The UI could map labels to reviewed explanation templates. A generative model could write richer summaries later, constrained to verified findings. Jev itself is not designed to write those explanations.

## Could this replace WoWAnalyzer or Wipefest?

A new product could compete with them, but Jev would supply only part of the system. It would still need report ingestion, correct event reconstruction, spec and encounter knowledge, useful timelines, and ongoing patch maintenance.

The potential benefit is a reusable interpretation layer: the same interface could review cooldown findings, mechanic failures, and conflicting evidence. Test it against deterministic rules to see whether it improves accuracy or reduces maintenance.

TypeSafe documents limitations involving arithmetic, indirect questions, irrelevant context, and adversarial input. Typed outputs do not remove those problems. [Known limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13)

I would start with one spec, one encounter, and a labeled collection of findings reviewed by experienced players. Measure incorrect advice and unnecessary review alongside latency and cost. Show the source evidence for every suggestion.

Jev could help select an interpretation, but the analysis engine still has to establish the facts. I would judge the prototype by how often experienced players agree with its advice and can verify it from the linked events.';

-- Which WoW Creators Predicted the Midnight Season 2 Mythic+ Meta Best?
UPDATE content
SET markdown = 'Tier lists are easy to grade with hindsight and hard to make before a live meta is visible. Most creators were working from PTR testing, unfinished tuning, a new dungeon pool, and no live-key evidence. Five weeks into Midnight Season 2, we finally have enough data to ask a fairer question: whose early Mythic+ rankings most closely matched the high-key meta that formed?

This is a follow-up to my [pre-season creator aggregate](https://orboro.net/blog/what-wow-creators-think-is-strong-in-mythic-plus-for-midnight-season-2). That article combined lists to find consensus. Here, each qualifying forecast is compared with the same five-week MythicStats benchmark. The review includes the original sources, additional full-board forecasts, and each creator’s own tiers.

With hindsight, placing Blood Death Knight, Holy Paladin, Arms Warrior, and Arcane Mage near the top looks straightforward. Ranking 40 specs before the live-meta benchmark existed was a much harder assignment.

> Eligibility: the forecast had to be published before the first MythicStats benchmark capture, explicitly cover Mythic+, and rank at least 26 of the 40 specs. A board covering 26 or 27 DPS specs meets that threshold. Short six- or seven-spec tank and healer lists remain useful source material, but they are not placed on this leaderboard.

[Open the complete prediction review workbook](https://docs.google.com/spreadsheets/d/1SRv8znRSX1AWqOHHtU_PKyKqqQG7ldOu0Q6p944P1-0/edit?gid=0#gid=0). It contains the leaderboard, the five-week meta benchmark, a plain-language method tab, and one tab per creator with the extracted tier list and every per-spec comparison.

## Creator prediction accuracy tier list

{{midnight_creator_accuracy_tier_list}}

No creator reached A or S. A B-tier score means the board retained some agreement with the benchmark after errors across each ranked role were counted. The five-week benchmark was concentrated around the leading specs in each role.

izen finished first at 61.6 and was the most even full-board forecaster, scoring 60.0 for tanks, 61.9 for healers, and 63.0 for DPS. YoDaTV followed at 60.6 after the coverage adjustment and made the strongest tank prediction in the group at 73.3. Petko and Tactyks / Method followed with balanced full-roster results. Dorki''s August 19 full-board forecast entered fifth at 58.4, just ahead of Tettles after the DPS-only coverage adjustment.

## What the first five weeks actually looked like

The benchmark averages specialization representation in MythicStats'' top 2,000 keys across periods 1077 through 1081, the first five weekly snapshots used for this review.

| Role | Highest five-week representation |
| --- | --- |
| Tank | Blood Death Knight 11.64%, Guardian Druid 3.48%, Protection Paladin 1.96% |
| Healer | Holy Paladin 9.86%, Restoration Shaman 7.16%, Holy Priest 1.22% |
| DPS | Arms Warrior 12.24%, Arcane Mage 11.90%, Elemental Shaman 7.70% |

The broad pre-season consensus got several headline calls right. Blood Death Knight led tanks. Holy Paladin and Restoration Shaman separated from the healer field. Arms Warrior, Arcane Mage, and Elemental Shaman became the three most represented DPS specs.

The harder part was the shape underneath those leaders. Holy Priest rose to third among healers despite generally weak pre-season placement. Assassination Rogue, Demonology Warlock, and Retribution Paladin all landed in the top six DPS by representation. Frost Death Knight, one of the strongest points of creator consensus in the original article, finished near the middle of the live DPS ordering instead of beside Arms and Arcane.

A board can identify several good specs and still misplace them relative to the rest of the role. Comparing the full ordering shows those misses, even when the headline picks were right.

## How the score works

Different creators used different labels. One board might use S through D, another might use S+, S, A+, and A, and another might use descriptive groups. Comparing the letters directly would reward formatting choices instead of predictions, so every board goes through the same normalization.

1. Qualify the forecast. It must predate the first MythicStats benchmark capture, explicitly cover Mythic+, and rank at least 26 specs.
2. Keep the creator''s own tiers and ties. Specs in the same tier stay tied.
3. Normalize the prediction inside each role. The top predicted position becomes 100, the bottom becomes 0, and tied specs share the midpoint of the positions they occupy.
4. Build the actual five-week ordering. Each spec''s MythicStats representation is averaged across periods 1077 to 1081, then converted to the same within-role 0 to 100 scale.
5. Measure every miss. Per-spec error is the absolute difference between the prediction percentile and the actual percentile.
6. Score each role. Role accuracy is `max(0, 100 - 2 × mean absolute error)`.
7. Weight roles equally. A full board''s tank, healer, and DPS scores each contribute one-third. The 27 DPS specs cannot drown out the smaller tank and healer pools.
8. Apply a small coverage adjustment. Final accuracy is `raw agreement × [0.85 + 0.15 × (ranked specs ÷ 40)]`.

A complete 40-spec board keeps 100% of its raw score. A 27-spec DPS board keeps 95.1%, and a 26-spec board keeps 94.8%. This lets substantial DPS forecasts compete without pretending that ranking one role is exactly the same assignment as ranking all three.

For a simple example, suppose a spec was predicted at the 80th percentile and finished at the 60th. Its error is 20 points. If every spec in that role averaged a 15-point error, the role score would be `100 - 2 × 15 = 70`. If that came from a 27-spec board, the final would be `70 × 95.1% = 66.6`.

The grade bands are:

- S: 80 to 100
- A: 65 to 79.9
- B: 50 to 64.9
- C: 35 to 49.9
- D: below 35

The workbook''s Method tab shows the same calculation step by step, and every creator tab exposes the normalized prediction, actual percentile, and absolute error used in the score.

## Notes on the 13 qualifying forecasts

- izen ranked all 40 specs in a final pre-season video and finished first with the most consistent scores across all three roles.
- YoDaTV ranked 35 specs. The tank board was the strongest role prediction in this comparison, while the healer ordering was less accurate.
- Petko is represented by the final August 9 progressive tier list, not an earlier update. All 40 specs are recorded from that final board.
- Tactyks / Method adds a full written forecast to a source set otherwise dominated by videos. It was updated August 13 and ranked all 40 specs.
- Dorki published a complete 40-spec video board on August 19, before the first MythicStats benchmark capture. His 63.0 DPS score was the strongest part of a 58.4 overall result.
- Tettles ranked all 27 DPS specs and placed sixth after the coverage adjustment.
- Naowh / Robin panel ranked every spec and was strongest on DPS.
- zor thas ranked all 40 specs. The DPS ordering scored well, but the tank ordering lowered the full-board result.
- Saltii published separate melee and ranged videos. I combined those two boards into one complete 27-spec DPS forecast before scoring it.
- mulltiy ranked 26 DPS specs. One explicitly unranked spec was omitted instead of being silently treated as last.
- Casualaddict covered all 27 DPS specs in a pre-tuning Twitch VOD upload.
- Chorsh ranked 36 specs and receives only a very small coverage adjustment.
- Kushi ranked all 40 specs. The DPS board retained some agreement, but large tank and healer misses pulled down the equal-role result.

## Why shorter role lists are still kept separate

The original research included useful specialist forecasts from tank and healer creators. They remain in the source audit and still help explain pre-season consensus. They are not ranked here because a six-spec tank board or seven-spec healer board has far fewer opportunities to be wrong than a 26- to 40-spec forecast.

I chose 26 specs as the cutoff to include complete or nearly complete DPS boards while excluding forecasts that named only a handful of favorites.

## What this score does and does not say

MythicStats representation is a picture of what the high-key field selected and completed with. It is not a simulation of theoretical damage, healing, survivability, or ordinary-pug success. Popularity, title-range key pressure, coordinated composition, community perception, and tuning all affect representation.

This is an early-season checkpoint. Later tuning can change how well a forecast matches the live meta. The score measures how closely each qualifying Mythic+ forecast’s ordering matched the first five weeks of the high-key meta.

For the complete written record, use the [shared prediction review workbook](https://docs.google.com/spreadsheets/d/1SRv8znRSX1AWqOHHtU_PKyKqqQG7ldOu0Q6p944P1-0/edit?gid=0#gid=0). For the underlying weekly representation, see [MythicStats](https://mythicstats.com/).',
    updated_at = 1790789991154
WHERE slug = 'which-wow-creators-predicted-midnight-season-2-mythic-plus-meta-best' AND page_type = 'post' AND status = 'published'
  AND markdown <> 'Tier lists are easy to grade with hindsight and hard to make before a live meta is visible. Most creators were working from PTR testing, unfinished tuning, a new dungeon pool, and no live-key evidence. Five weeks into Midnight Season 2, we finally have enough data to ask a fairer question: whose early Mythic+ rankings most closely matched the high-key meta that formed?

This is a follow-up to my [pre-season creator aggregate](https://orboro.net/blog/what-wow-creators-think-is-strong-in-mythic-plus-for-midnight-season-2). That article combined lists to find consensus. Here, each qualifying forecast is compared with the same five-week MythicStats benchmark. The review includes the original sources, additional full-board forecasts, and each creator’s own tiers.

With hindsight, placing Blood Death Knight, Holy Paladin, Arms Warrior, and Arcane Mage near the top looks straightforward. Ranking 40 specs before the live-meta benchmark existed was a much harder assignment.

> Eligibility: the forecast had to be published before the first MythicStats benchmark capture, explicitly cover Mythic+, and rank at least 26 of the 40 specs. A board covering 26 or 27 DPS specs meets that threshold. Short six- or seven-spec tank and healer lists remain useful source material, but they are not placed on this leaderboard.

[Open the complete prediction review workbook](https://docs.google.com/spreadsheets/d/1SRv8znRSX1AWqOHHtU_PKyKqqQG7ldOu0Q6p944P1-0/edit?gid=0#gid=0). It contains the leaderboard, the five-week meta benchmark, a plain-language method tab, and one tab per creator with the extracted tier list and every per-spec comparison.

## Creator prediction accuracy tier list

{{midnight_creator_accuracy_tier_list}}

No creator reached A or S. A B-tier score means the board retained some agreement with the benchmark after errors across each ranked role were counted. The five-week benchmark was concentrated around the leading specs in each role.

izen finished first at 61.6 and was the most even full-board forecaster, scoring 60.0 for tanks, 61.9 for healers, and 63.0 for DPS. YoDaTV followed at 60.6 after the coverage adjustment and made the strongest tank prediction in the group at 73.3. Petko and Tactyks / Method followed with balanced full-roster results. Dorki''s August 19 full-board forecast entered fifth at 58.4, just ahead of Tettles after the DPS-only coverage adjustment.

## What the first five weeks actually looked like

The benchmark averages specialization representation in MythicStats'' top 2,000 keys across periods 1077 through 1081, the first five weekly snapshots used for this review.

| Role | Highest five-week representation |
| --- | --- |
| Tank | Blood Death Knight 11.64%, Guardian Druid 3.48%, Protection Paladin 1.96% |
| Healer | Holy Paladin 9.86%, Restoration Shaman 7.16%, Holy Priest 1.22% |
| DPS | Arms Warrior 12.24%, Arcane Mage 11.90%, Elemental Shaman 7.70% |

The broad pre-season consensus got several headline calls right. Blood Death Knight led tanks. Holy Paladin and Restoration Shaman separated from the healer field. Arms Warrior, Arcane Mage, and Elemental Shaman became the three most represented DPS specs.

The harder part was the shape underneath those leaders. Holy Priest rose to third among healers despite generally weak pre-season placement. Assassination Rogue, Demonology Warlock, and Retribution Paladin all landed in the top six DPS by representation. Frost Death Knight, one of the strongest points of creator consensus in the original article, finished near the middle of the live DPS ordering instead of beside Arms and Arcane.

A board can identify several good specs and still misplace them relative to the rest of the role. Comparing the full ordering shows those misses, even when the headline picks were right.

## How the score works

Different creators used different labels. One board might use S through D, another might use S+, S, A+, and A, and another might use descriptive groups. Comparing the letters directly would reward formatting choices instead of predictions, so every board goes through the same normalization.

1. Qualify the forecast. It must predate the first MythicStats benchmark capture, explicitly cover Mythic+, and rank at least 26 specs.
2. Keep the creator''s own tiers and ties. Specs in the same tier stay tied.
3. Normalize the prediction inside each role. The top predicted position becomes 100, the bottom becomes 0, and tied specs share the midpoint of the positions they occupy.
4. Build the actual five-week ordering. Each spec''s MythicStats representation is averaged across periods 1077 to 1081, then converted to the same within-role 0 to 100 scale.
5. Measure every miss. Per-spec error is the absolute difference between the prediction percentile and the actual percentile.
6. Score each role. Role accuracy is `max(0, 100 - 2 × mean absolute error)`.
7. Weight roles equally. A full board''s tank, healer, and DPS scores each contribute one-third. The 27 DPS specs cannot drown out the smaller tank and healer pools.
8. Apply a small coverage adjustment. Final accuracy is `raw agreement × [0.85 + 0.15 × (ranked specs ÷ 40)]`.

A complete 40-spec board keeps 100% of its raw score. A 27-spec DPS board keeps 95.1%, and a 26-spec board keeps 94.8%. This lets substantial DPS forecasts compete without pretending that ranking one role is exactly the same assignment as ranking all three.

For a simple example, suppose a spec was predicted at the 80th percentile and finished at the 60th. Its error is 20 points. If every spec in that role averaged a 15-point error, the role score would be `100 - 2 × 15 = 70`. If that came from a 27-spec board, the final would be `70 × 95.1% = 66.6`.

The grade bands are:

- S: 80 to 100
- A: 65 to 79.9
- B: 50 to 64.9
- C: 35 to 49.9
- D: below 35

The workbook''s Method tab shows the same calculation step by step, and every creator tab exposes the normalized prediction, actual percentile, and absolute error used in the score.

## Notes on the 13 qualifying forecasts

- izen ranked all 40 specs in a final pre-season video and finished first with the most consistent scores across all three roles.
- YoDaTV ranked 35 specs. The tank board was the strongest role prediction in this comparison, while the healer ordering was less accurate.
- Petko is represented by the final August 9 progressive tier list, not an earlier update. All 40 specs are recorded from that final board.
- Tactyks / Method adds a full written forecast to a source set otherwise dominated by videos. It was updated August 13 and ranked all 40 specs.
- Dorki published a complete 40-spec video board on August 19, before the first MythicStats benchmark capture. His 63.0 DPS score was the strongest part of a 58.4 overall result.
- Tettles ranked all 27 DPS specs and placed sixth after the coverage adjustment.
- Naowh / Robin panel ranked every spec and was strongest on DPS.
- zor thas ranked all 40 specs. The DPS ordering scored well, but the tank ordering lowered the full-board result.
- Saltii published separate melee and ranged videos. I combined those two boards into one complete 27-spec DPS forecast before scoring it.
- mulltiy ranked 26 DPS specs. One explicitly unranked spec was omitted instead of being silently treated as last.
- Casualaddict covered all 27 DPS specs in a pre-tuning Twitch VOD upload.
- Chorsh ranked 36 specs and receives only a very small coverage adjustment.
- Kushi ranked all 40 specs. The DPS board retained some agreement, but large tank and healer misses pulled down the equal-role result.

## Why shorter role lists are still kept separate

The original research included useful specialist forecasts from tank and healer creators. They remain in the source audit and still help explain pre-season consensus. They are not ranked here because a six-spec tank board or seven-spec healer board has far fewer opportunities to be wrong than a 26- to 40-spec forecast.

I chose 26 specs as the cutoff to include complete or nearly complete DPS boards while excluding forecasts that named only a handful of favorites.

## What this score does and does not say

MythicStats representation is a picture of what the high-key field selected and completed with. It is not a simulation of theoretical damage, healing, survivability, or ordinary-pug success. Popularity, title-range key pressure, coordinated composition, community perception, and tuning all affect representation.

This is an early-season checkpoint. Later tuning can change how well a forecast matches the live meta. The score measures how closely each qualifying Mythic+ forecast’s ordering matched the first five weeks of the high-key meta.

For the complete written record, use the [shared prediction review workbook](https://docs.google.com/spreadsheets/d/1SRv8znRSX1AWqOHHtU_PKyKqqQG7ldOu0Q6p944P1-0/edit?gid=0#gid=0). For the underlying weekly representation, see [MythicStats](https://mythicstats.com/).';

-- Why the Best Great Vault Reward in Midnight Season 2 Isn't an Item
UPDATE content
SET markdown = 'In Midnight Season 2, a Nebulous Voidcore can be worth more than a Great Vault item when you plan to keep bonus rolling the same loot pool. Its knockout protection makes it a strong weekly choice for building a long-term gear set.

A tier piece that completes your four-piece bonus or a weapon needed for progression can be worth taking immediately. The Voidcore’s advantage is that you can choose where to spend it, and each item it awards leaves the bonus-roll pool.

> If you would keep bonus rolling the same boss or dungeon after taking its Vault item, favor the Voidcore unless you need that upgrade for current progression.

## How Season 2 bonus rolls work

Beginning with the August 25 reset in North America, characters that unlock at least three Great Vault reward slots can select one Nebulous Voidcore instead of an item. Those three slots can come from any combination of the Raid, Dungeon, and World rows.

A Voidcore can be spent after defeating a Season 2 raid boss or completing an eligible Mythic+ dungeon, Bountiful Delve, or Nightmare Prey Hunt. The resulting item uses the loot table for that activity and your active loot specialization.

Bonus-roll rewards use the Great Vault reward level for that content, which can be higher than the ordinary end-of-run drop:

| Content | Bonus-roll reward |
| --- | --- |
| Heroic raid boss | Myth 1/6 |
| Mythic raid bosses 1–6, except Very Rare items | Myth 6/6 |
| Final two Mythic raid bosses | Item level 344, equivalent to Myth 9 |
| Mythic+ 10 or higher | Myth 1/6 |
| Tier 8 Bountiful Delve | Hero 1/6 |

Very Rare Mythic raid items also use the Myth 9 equivalent reward level.

Raid rolls also cost only one Voidcore in Season 2, down from two in Season 1. Blizzard explains the raid reward changes in its [Curse of Ula''tek endgame reward post](https://us.forums.blizzard.com/en/wow/t/curse-of-ulatek-endgame-reward-changes/2317450), while [Wowhead''s Season 2 bonus-roll guide](https://www.wowhead.com/ptr/guide/midnight/bonus-rolls-item-upgrades) covers the current acquisition rules and reward levels.

## How the knockout list changes the math

Bonus rolls use a knockout system: each awarded item leaves the pool for later rolls.

When a Voidcore awards an item, that item is recorded for your character and removed from subsequent bonus rolls from that loot pool. As items leave that pool, a later roll has fewer remaining possibilities. Blizzard described this intended behavior when it explained and fixed the initial Season 1 duplicate bug: [each Voidcore item is checked off a character-specific list](https://us.forums.blizzard.com/en/wow/t/bonus-rolls-%E2%80%93-what-happened-and-next-steps/2296587/1).

There is one important limitation: taking an item directly from the Great Vault does not check it off the bonus-roll list. Neither does receiving it as an ordinary drop. If you later spend a Voidcore on the same pool, the system can award that item again.

Suppose a boss has four equally likely items available to your loot specialization, you want all four, and none has been checked off your bonus-roll list. Assume no tuning or loot-specialization changes alter which items are eligible between rolls.

- Taking four consecutive Voidcores and rolling that boss four times gives you all four items. Each roll removes one option.
- Taking one of those items from the Vault leaves all four items available for your first bonus roll. Three Voidcores then remove three of those four items.

In the second scenario, there is a 75% chance that one of those three rolls reproduces the item you already selected from the Vault. After four weekly selections, you expect to own 3.25 unique items instead of the four guaranteed by choosing four Voidcores.

Choosing four Voidcores removes the duplicate risk in this example.

## Why target Heroic raid bosses?

Heroic raid bosses are unusually attractive targets because their bonus rolls award Myth 1/6 gear. A character can obtain Myth-track versions of powerful raid weapons, trinkets, necklaces, tier pieces, and special-effect armor without defeating the corresponding boss on Mythic.

Raid bosses also tend to have smaller and more concentrated loot pools than Mythic+ dungeons. If one boss offers three or four items that are all useful to your specialization, every roll is productive and every knockout brings you closer to the remaining pieces.

This is the situation behind much of the current community advice. Izen''s video [The Great Vault Loot Is a Great Bait](https://www.youtube.com/watch?v=Oeab1J60RfI&t=538s) explains the Vault and knockout conflict beginning around 8:58. Awoo''s [Season 2 Gearing Guide](https://www.youtube.com/watch?v=bquUuCgK3c4&t=46s) argues that most specializations should begin by taking Voidcores, then plan their raid and dungeon pools instead of chasing isolated items.

The same concern appears repeatedly in community discussions. Players in [CompetitiveWoW](https://www.reddit.com/r/CompetitiveWoW/comments/1viay2b/the_121_vault_and_bonus_roll_interaction_needs_a/) have criticized the system for making a good Vault item a possible duplicate later, while a broader [r/wow discussion](https://www.reddit.com/r/wow/comments/1vuo7yb/most_class_guides_are_telling_people_to_take_the/) reaches the same general conclusion while identifying several important exceptions.

## You can save a Voidcore for later

When a Voidcore is the better choice for your character, claim it from the Vault. You do not have to spend it immediately.

Banking a core lets you choose its target later. You can wait until your group reaches Heroic, until an early Mythic boss becomes realistically farmable, or until your normal drops reveal which target pool has the greatest remaining value.

Spending without a plan can waste the system''s biggest advantage. Before rolling, answer four questions:

1. Which boss or dungeon contains several items I would genuinely use?
2. Which loot specialization gives me the smallest useful pool?
3. Can I repeat this content enough times to finish or substantially thin that pool?
4. Does this pool overlap with gear I plan to craft, catalyze, or obtain elsewhere?

Changing loot specialization can sometimes remove an unwanted weapon or trinket from the available list. Removing an unwanted item leaves a smaller pool, but the correct loot specialization varies by class.

## When to take the Vault item

Treat the Voidcore as a starting point for the decision. Take the actual item when its immediate or guaranteed value is greater than the long-term value of another roll.

Good reasons include:

- The item immediately completes an important two-piece or four-piece tier bonus.
- It is a major weapon or trinket upgrade your group needs for current progression.
- It is the only item you want from that boss or dungeon.
- The surrounding bonus-roll pool is large and filled with items you would not use.
- You cannot reliably reach or repeat the content you planned to roll.
- You are unlikely to play the character long enough for knockout protection to pay off.
- You have already cleared the high-value pools available to your character.

A guaranteed best-in-slot Mythic+ trinket is the clearest example. If the rest of its dungeon pool is unattractive, accepting the trinket now can be better than spending several weekly Voidcores clearing unwanted items.

The other major tradeoff is power now versus power later. A progression guild may gain more from equipping a large upgrade before tonight''s raid than from completing a theoretically perfect gear set several weeks sooner. Long-term optimization is not always the same as maximizing the chance of killing the current boss.

## Check your specialization before deciding

The correct target depends on your specialization, active loot specialization, current gear, and the content you can consistently complete. Before claiming your Vault, check the Season 2 Gear, Best-in-Slot, and Bonus Roll sections for your specialization on [Wowhead](https://www.wowhead.com/guides/classes) or [Icy Veins](https://www.icy-veins.com/wow/class-guides). Icy Veins also maintains a convenient [Season 2 best-in-slot index for every specialization](https://www.icy-veins.com/wow/news/great-vault-best-in-slot-picks-for-every-specialization-in-midnight-season-2/).

For the newest theorycrafting, loot-specialization tricks, and advice following hotfixes, consult the pinned resources in your class Discord. Wowhead provides a [directory of current class Discord servers](https://www.wowhead.com/discord-servers).

Do not blindly copy a generic best-in-slot list. Check the guide''s recommended bonus-roll target, required loot specialization, raid difficulty, and most recent update date. A player farming Heroic Ula''tek, a Mythic raider targeting early bosses, and someone who only runs Mythic+ may all have different optimal plans.

## Plan around the remaining loot pool

The Great Vault normally asks you to choose the best item from a random collection. The Nebulous Voidcore changes that decision. Instead of taking one result now, you can choose the activity, difficulty, loot specialization, and timing of a future result, and narrow the remaining pool with each bonus roll.

That control makes the Voidcore especially useful when several items in the same pool would improve your gear. If you intend to keep rolling a source, taking one of its items from the Vault does not save you a roll. It creates a chance that a future roll gives you the same item again.

If several remaining items from one source would help, plan your rolls around that pool. If a Vault upgrade would help your group progress now, weigh that gain before choosing the core.',
    updated_at = 1790789991154
WHERE slug = 'why-the-best-great-vault-reward-in-midnight-season-2-isnt-an-item' AND page_type = 'post' AND status = 'published'
  AND markdown <> 'In Midnight Season 2, a Nebulous Voidcore can be worth more than a Great Vault item when you plan to keep bonus rolling the same loot pool. Its knockout protection makes it a strong weekly choice for building a long-term gear set.

A tier piece that completes your four-piece bonus or a weapon needed for progression can be worth taking immediately. The Voidcore’s advantage is that you can choose where to spend it, and each item it awards leaves the bonus-roll pool.

> If you would keep bonus rolling the same boss or dungeon after taking its Vault item, favor the Voidcore unless you need that upgrade for current progression.

## How Season 2 bonus rolls work

Beginning with the August 25 reset in North America, characters that unlock at least three Great Vault reward slots can select one Nebulous Voidcore instead of an item. Those three slots can come from any combination of the Raid, Dungeon, and World rows.

A Voidcore can be spent after defeating a Season 2 raid boss or completing an eligible Mythic+ dungeon, Bountiful Delve, or Nightmare Prey Hunt. The resulting item uses the loot table for that activity and your active loot specialization.

Bonus-roll rewards use the Great Vault reward level for that content, which can be higher than the ordinary end-of-run drop:

| Content | Bonus-roll reward |
| --- | --- |
| Heroic raid boss | Myth 1/6 |
| Mythic raid bosses 1–6, except Very Rare items | Myth 6/6 |
| Final two Mythic raid bosses | Item level 344, equivalent to Myth 9 |
| Mythic+ 10 or higher | Myth 1/6 |
| Tier 8 Bountiful Delve | Hero 1/6 |

Very Rare Mythic raid items also use the Myth 9 equivalent reward level.

Raid rolls also cost only one Voidcore in Season 2, down from two in Season 1. Blizzard explains the raid reward changes in its [Curse of Ula''tek endgame reward post](https://us.forums.blizzard.com/en/wow/t/curse-of-ulatek-endgame-reward-changes/2317450), while [Wowhead''s Season 2 bonus-roll guide](https://www.wowhead.com/ptr/guide/midnight/bonus-rolls-item-upgrades) covers the current acquisition rules and reward levels.

## How the knockout list changes the math

Bonus rolls use a knockout system: each awarded item leaves the pool for later rolls.

When a Voidcore awards an item, that item is recorded for your character and removed from subsequent bonus rolls from that loot pool. As items leave that pool, a later roll has fewer remaining possibilities. Blizzard described this intended behavior when it explained and fixed the initial Season 1 duplicate bug: [each Voidcore item is checked off a character-specific list](https://us.forums.blizzard.com/en/wow/t/bonus-rolls-%E2%80%93-what-happened-and-next-steps/2296587/1).

There is one important limitation: taking an item directly from the Great Vault does not check it off the bonus-roll list. Neither does receiving it as an ordinary drop. If you later spend a Voidcore on the same pool, the system can award that item again.

Suppose a boss has four equally likely items available to your loot specialization, you want all four, and none has been checked off your bonus-roll list. Assume no tuning or loot-specialization changes alter which items are eligible between rolls.

- Taking four consecutive Voidcores and rolling that boss four times gives you all four items. Each roll removes one option.
- Taking one of those items from the Vault leaves all four items available for your first bonus roll. Three Voidcores then remove three of those four items.

In the second scenario, there is a 75% chance that one of those three rolls reproduces the item you already selected from the Vault. After four weekly selections, you expect to own 3.25 unique items instead of the four guaranteed by choosing four Voidcores.

Choosing four Voidcores removes the duplicate risk in this example.

## Why target Heroic raid bosses?

Heroic raid bosses are unusually attractive targets because their bonus rolls award Myth 1/6 gear. A character can obtain Myth-track versions of powerful raid weapons, trinkets, necklaces, tier pieces, and special-effect armor without defeating the corresponding boss on Mythic.

Raid bosses also tend to have smaller and more concentrated loot pools than Mythic+ dungeons. If one boss offers three or four items that are all useful to your specialization, every roll is productive and every knockout brings you closer to the remaining pieces.

This is the situation behind much of the current community advice. Izen''s video [The Great Vault Loot Is a Great Bait](https://www.youtube.com/watch?v=Oeab1J60RfI&t=538s) explains the Vault and knockout conflict beginning around 8:58. Awoo''s [Season 2 Gearing Guide](https://www.youtube.com/watch?v=bquUuCgK3c4&t=46s) argues that most specializations should begin by taking Voidcores, then plan their raid and dungeon pools instead of chasing isolated items.

The same concern appears repeatedly in community discussions. Players in [CompetitiveWoW](https://www.reddit.com/r/CompetitiveWoW/comments/1viay2b/the_121_vault_and_bonus_roll_interaction_needs_a/) have criticized the system for making a good Vault item a possible duplicate later, while a broader [r/wow discussion](https://www.reddit.com/r/wow/comments/1vuo7yb/most_class_guides_are_telling_people_to_take_the/) reaches the same general conclusion while identifying several important exceptions.

## You can save a Voidcore for later

When a Voidcore is the better choice for your character, claim it from the Vault. You do not have to spend it immediately.

Banking a core lets you choose its target later. You can wait until your group reaches Heroic, until an early Mythic boss becomes realistically farmable, or until your normal drops reveal which target pool has the greatest remaining value.

Spending without a plan can waste the system''s biggest advantage. Before rolling, answer four questions:

1. Which boss or dungeon contains several items I would genuinely use?
2. Which loot specialization gives me the smallest useful pool?
3. Can I repeat this content enough times to finish or substantially thin that pool?
4. Does this pool overlap with gear I plan to craft, catalyze, or obtain elsewhere?

Changing loot specialization can sometimes remove an unwanted weapon or trinket from the available list. Removing an unwanted item leaves a smaller pool, but the correct loot specialization varies by class.

## When to take the Vault item

Treat the Voidcore as a starting point for the decision. Take the actual item when its immediate or guaranteed value is greater than the long-term value of another roll.

Good reasons include:

- The item immediately completes an important two-piece or four-piece tier bonus.
- It is a major weapon or trinket upgrade your group needs for current progression.
- It is the only item you want from that boss or dungeon.
- The surrounding bonus-roll pool is large and filled with items you would not use.
- You cannot reliably reach or repeat the content you planned to roll.
- You are unlikely to play the character long enough for knockout protection to pay off.
- You have already cleared the high-value pools available to your character.

A guaranteed best-in-slot Mythic+ trinket is the clearest example. If the rest of its dungeon pool is unattractive, accepting the trinket now can be better than spending several weekly Voidcores clearing unwanted items.

The other major tradeoff is power now versus power later. A progression guild may gain more from equipping a large upgrade before tonight''s raid than from completing a theoretically perfect gear set several weeks sooner. Long-term optimization is not always the same as maximizing the chance of killing the current boss.

## Check your specialization before deciding

The correct target depends on your specialization, active loot specialization, current gear, and the content you can consistently complete. Before claiming your Vault, check the Season 2 Gear, Best-in-Slot, and Bonus Roll sections for your specialization on [Wowhead](https://www.wowhead.com/guides/classes) or [Icy Veins](https://www.icy-veins.com/wow/class-guides). Icy Veins also maintains a convenient [Season 2 best-in-slot index for every specialization](https://www.icy-veins.com/wow/news/great-vault-best-in-slot-picks-for-every-specialization-in-midnight-season-2/).

For the newest theorycrafting, loot-specialization tricks, and advice following hotfixes, consult the pinned resources in your class Discord. Wowhead provides a [directory of current class Discord servers](https://www.wowhead.com/discord-servers).

Do not blindly copy a generic best-in-slot list. Check the guide''s recommended bonus-roll target, required loot specialization, raid difficulty, and most recent update date. A player farming Heroic Ula''tek, a Mythic raider targeting early bosses, and someone who only runs Mythic+ may all have different optimal plans.

## Plan around the remaining loot pool

The Great Vault normally asks you to choose the best item from a random collection. The Nebulous Voidcore changes that decision. Instead of taking one result now, you can choose the activity, difficulty, loot specialization, and timing of a future result, and narrow the remaining pool with each bonus roll.

That control makes the Voidcore especially useful when several items in the same pool would improve your gear. If you intend to keep rolling a source, taking one of its items from the Vault does not save you a roll. It creates a chance that a future roll gives you the same item again.

If several remaining items from one source would help, plan your rolls around that pool. If a Vault upgrade would help your group progress now, weigh that gain before choosing the core.';

-- What WoW Creators Think Is Strong in Mythic+ for Midnight Season 2
UPDATE content
SET markdown = 'Tier lists can disagree for good reasons. Different creators test at different key levels, assume different group compositions, and sometimes use completely different tier labels. I wanted to see what the picture looked like when those lists were combined instead of treating any single video as the answer.

For this aggregate, I reviewed 29 YouTube videos published during the 30 days leading up to August 9, 2026. Sixteen comparable manual-play Mythic+ videos contributed at least one scored placement. General, Raid, Assisted Combat, partial, derivative, and parody lists were kept in the source audit but were not mixed into the headline Mythic+ result.

The final workbook contains 421 placement rows. Every creator list was normalized within its own board, then weighted by publication date using a 14-day half-life. More recent lists matter more, but older PTR testing still contributes.

The result summarizes creators’ relative spec rankings. It does not estimate DPS or survivability.

> Coverage: every tank has 8 ranked sources, healers have 6 to 7, and DPS specs have 6 to 8. Explicitly unranked specs were left out of that source score instead of being treated as last place.

{{midnight_sheet_link}}

## Weighted aggregate tier list

The weighted scores use these fixed bands:

- S: 80 to 100
- A: 60 to 79.9
- B: 40 to 59.9
- C: 20 to 39.9
- D: below 20

The number after each spec is its recency-weighted aggregate score. Compare scores within the same role. Role-specific and all-spec boards use different comparison pools, so a tank’s score and a DPS spec’s score are not equivalent measures of strength.

### Tanks

{{midnight_tier_list role="tanks"}}

Blood Death Knight is the clearest tank favorite in the collected lists. Protection Paladin holds a distinct second place, while Guardian, Protection Warrior, and Vengeance are packed much closer together.

### Healers

{{midnight_tier_list role="healers"}}

Holy Paladin and Restoration Shaman are the two healer picks with the strongest creator consensus. Mistweaver sits on its own in the middle, followed by a closer group of Discipline, Preservation, and Restoration Druid.

### DPS

{{midnight_tier_list role="dps"}}

Arms Warrior and Arcane Mage are the strongest points of agreement across the DPS lists. Elemental Shaman and Frost Death Knight round out the S tier. Devourer lands just below the cutoff, although it has one fewer scored source because one creator left it unranked.

## How the scoring works

1. Each video keeps its original tier names and ordering.
2. Each placement becomes a percentile from 0 to 100 within that list. Tied specs share the midpoint of the positions they occupy.
3. Explicitly unranked specs and duplicate creator/spec entries are not scored.
4. Each normalized score is multiplied by the video recency weight.
5. The weighted scores are averaged for each spec.

This avoids forcing every creator into the same S-through-D labels. It puts boards with different numbers of tiers on the same 0-to-100 scale. Their ties still affect the resulting scores.

The spread between a spec''s best and worst placement is available in the workbook. A high average with a wide spread means creators disagreed, while a high average with a narrow spread is a stronger consensus.

## Videos included in the Mythic+ aggregate

- [YoDaTV: The FINAL Spec Tierlist Before 12.1 Launches](https://www.youtube.com/watch?v=Zc-pNsazA90) · August 8 · all specs
- [Tettles: M+ DPS Tier List](https://www.youtube.com/watch?v=8W_Ezsy1u6I) · August 8 · DPS
- [Petko: Progressive M+ Tier List, Update 4](https://www.youtube.com/watch?v=WWRNellRn-4) · August 2 · all specs
- [Awoo: Official Meta Tank Tier List](https://www.youtube.com/watch?v=Nf28Kxcmjf4) · August 9 · tanks
- [Tactyks: Season 2 Tank Rankings](https://www.youtube.com/watch?v=TaJvkmzeJ_8) · August 9 · Mythic+ tank board
- [AutomaticJak: Season 2 PTR M+ Healer Tier List](https://www.youtube.com/watch?v=AfxJlv15i04) · August 1 · healers
- [MadSkillzzTV: 12.1 Best M+ Healers](https://www.youtube.com/watch?v=Zf3GQqG-z8s) · July 28 · healers
- [LBNinja7: Updated Midnight Healer Meta Prediction](https://www.youtube.com/watch?v=gvh4R_QSwaI) · August 2 · healers
- [mulltiy: Mythic+ DPS Tier List Midnight Season 2](https://www.youtube.com/watch?v=CTlLWOcIx40) · August 4 · DPS
- [Saltii: Melee DPS Updated Tier List](https://www.youtube.com/watch?v=qrXc0jCNskE) · August 2 · melee DPS
- [Saltii: Ranged DPS Updated Tier List](https://www.youtube.com/watch?v=Yv_Pj8W0608) · August 1 · ranged DPS
- [Casualaddict: Midnight Season 2 Tier List](https://www.youtube.com/watch?v=GKA7XF7sRtE) · August 6 · DPS
- [Kushi: S2 Midnight M+ Tier List](https://www.youtube.com/watch?v=Ux9DoFKaddY) · July 21 · all specs
- [Chorsh: Thoughts on All Tanks, Healers, and DPS for M+](https://www.youtube.com/watch?v=9n0fHh5ouLg) · July 26 · all specs
- [Venn: Tank Tier List for Pugging](https://www.youtube.com/watch?v=N54zknZ2PJs) · July 28 · tanks
- [WoW at Night: Midnight Season 2 Tank Rankings](https://www.youtube.com/watch?v=Fnxt6pCZVgk) · August 7 · tanks

## Reviewed but kept separate

These videos are still part of the source audit, but they are not blended into the manual-play Mythic+ result.

- [The Comeback Kids: Final 12.1 DPS Tier List](https://www.youtube.com/watch?v=h4UnwiKkBbk) · general DPS scope
- [Kiratank_tv: Final Tier List After PTR Testing](https://www.youtube.com/watch?v=uAMS5iVIiDk) · mixed mode
- [AutomaticJak: PTR Raid Healer Tier List](https://www.youtube.com/watch?v=SQyKJx6FEVA) · Raid
- [Andrew T: PTR Raid Tier List](https://www.youtube.com/watch?v=PRYUas-Y2wM) · composition tables rather than a stable tier board
- [Saltii: Ranged Single-Button Assistant Tier List](https://www.youtube.com/watch?v=HagkQsL3GYo) · Assisted Combat
- [Saltii: Melee Single-Button Assistant Tier List](https://www.youtube.com/watch?v=ZasmdZXV2sk) · Assisted Combat
- [Skandar Tank: Final Meta Predictions](https://www.youtube.com/watch?v=lrxuzyd0RHo) · partial meta picks
- [Geezax: Mythic+ DPS Ranking](https://www.youtube.com/watch?v=7XQ_Bku3qF0) · derivative of the Icy Veins and Petko ranking
- [Geezax: Mythic+ Tank and Healer Ranking](https://www.youtube.com/watch?v=uzQF_DHbCng) · derivative of the Icy Veins and Petko ranking
- [CapyQueenVideos: Every Tank and Healer](https://www.youtube.com/watch?v=NxHrTtg4ofk) · summarizes one Icy Veins author
- [Spielbursche: Updated 12.1 Tier List](https://www.youtube.com/watch?v=yudJA7erAtY) · not explicitly Mythic+ scoped
- [Nolifehenry: Official 12.1 Curse of Ula''Tek Tier List](https://www.youtube.com/watch?v=DMjkKEbDVYw) · mixes raid and key discussion
- [Shadarek: Midnight Season 2 Tier List](https://www.youtube.com/watch?v=Z8Jygl_NpF4) · parody list

## Caveats

- PTR tuning can make a ranking stale quickly. Recency weighting reduces that problem but cannot remove it.
- These are creator judgments, not simulations.
- Different videos target different key levels and group assumptions.
- Role-specific lists and all-spec lists create different comparison pools.
- A missing ranking is not treated as a last-place vote.

The workbook keeps the raw tier label, normalized score, publication date, recency weight, evidence timestamp, and full source link for every stored placement.',
    updated_at = 1790789991154
WHERE slug = 'what-wow-creators-think-is-strong-in-mythic-plus-for-midnight-season-2' AND page_type = 'post' AND status = 'published'
  AND markdown <> 'Tier lists can disagree for good reasons. Different creators test at different key levels, assume different group compositions, and sometimes use completely different tier labels. I wanted to see what the picture looked like when those lists were combined instead of treating any single video as the answer.

For this aggregate, I reviewed 29 YouTube videos published during the 30 days leading up to August 9, 2026. Sixteen comparable manual-play Mythic+ videos contributed at least one scored placement. General, Raid, Assisted Combat, partial, derivative, and parody lists were kept in the source audit but were not mixed into the headline Mythic+ result.

The final workbook contains 421 placement rows. Every creator list was normalized within its own board, then weighted by publication date using a 14-day half-life. More recent lists matter more, but older PTR testing still contributes.

The result summarizes creators’ relative spec rankings. It does not estimate DPS or survivability.

> Coverage: every tank has 8 ranked sources, healers have 6 to 7, and DPS specs have 6 to 8. Explicitly unranked specs were left out of that source score instead of being treated as last place.

{{midnight_sheet_link}}

## Weighted aggregate tier list

The weighted scores use these fixed bands:

- S: 80 to 100
- A: 60 to 79.9
- B: 40 to 59.9
- C: 20 to 39.9
- D: below 20

The number after each spec is its recency-weighted aggregate score. Compare scores within the same role. Role-specific and all-spec boards use different comparison pools, so a tank’s score and a DPS spec’s score are not equivalent measures of strength.

### Tanks

{{midnight_tier_list role="tanks"}}

Blood Death Knight is the clearest tank favorite in the collected lists. Protection Paladin holds a distinct second place, while Guardian, Protection Warrior, and Vengeance are packed much closer together.

### Healers

{{midnight_tier_list role="healers"}}

Holy Paladin and Restoration Shaman are the two healer picks with the strongest creator consensus. Mistweaver sits on its own in the middle, followed by a closer group of Discipline, Preservation, and Restoration Druid.

### DPS

{{midnight_tier_list role="dps"}}

Arms Warrior and Arcane Mage are the strongest points of agreement across the DPS lists. Elemental Shaman and Frost Death Knight round out the S tier. Devourer lands just below the cutoff, although it has one fewer scored source because one creator left it unranked.

## How the scoring works

1. Each video keeps its original tier names and ordering.
2. Each placement becomes a percentile from 0 to 100 within that list. Tied specs share the midpoint of the positions they occupy.
3. Explicitly unranked specs and duplicate creator/spec entries are not scored.
4. Each normalized score is multiplied by the video recency weight.
5. The weighted scores are averaged for each spec.

This avoids forcing every creator into the same S-through-D labels. It puts boards with different numbers of tiers on the same 0-to-100 scale. Their ties still affect the resulting scores.

The spread between a spec''s best and worst placement is available in the workbook. A high average with a wide spread means creators disagreed, while a high average with a narrow spread is a stronger consensus.

## Videos included in the Mythic+ aggregate

- [YoDaTV: The FINAL Spec Tierlist Before 12.1 Launches](https://www.youtube.com/watch?v=Zc-pNsazA90) · August 8 · all specs
- [Tettles: M+ DPS Tier List](https://www.youtube.com/watch?v=8W_Ezsy1u6I) · August 8 · DPS
- [Petko: Progressive M+ Tier List, Update 4](https://www.youtube.com/watch?v=WWRNellRn-4) · August 2 · all specs
- [Awoo: Official Meta Tank Tier List](https://www.youtube.com/watch?v=Nf28Kxcmjf4) · August 9 · tanks
- [Tactyks: Season 2 Tank Rankings](https://www.youtube.com/watch?v=TaJvkmzeJ_8) · August 9 · Mythic+ tank board
- [AutomaticJak: Season 2 PTR M+ Healer Tier List](https://www.youtube.com/watch?v=AfxJlv15i04) · August 1 · healers
- [MadSkillzzTV: 12.1 Best M+ Healers](https://www.youtube.com/watch?v=Zf3GQqG-z8s) · July 28 · healers
- [LBNinja7: Updated Midnight Healer Meta Prediction](https://www.youtube.com/watch?v=gvh4R_QSwaI) · August 2 · healers
- [mulltiy: Mythic+ DPS Tier List Midnight Season 2](https://www.youtube.com/watch?v=CTlLWOcIx40) · August 4 · DPS
- [Saltii: Melee DPS Updated Tier List](https://www.youtube.com/watch?v=qrXc0jCNskE) · August 2 · melee DPS
- [Saltii: Ranged DPS Updated Tier List](https://www.youtube.com/watch?v=Yv_Pj8W0608) · August 1 · ranged DPS
- [Casualaddict: Midnight Season 2 Tier List](https://www.youtube.com/watch?v=GKA7XF7sRtE) · August 6 · DPS
- [Kushi: S2 Midnight M+ Tier List](https://www.youtube.com/watch?v=Ux9DoFKaddY) · July 21 · all specs
- [Chorsh: Thoughts on All Tanks, Healers, and DPS for M+](https://www.youtube.com/watch?v=9n0fHh5ouLg) · July 26 · all specs
- [Venn: Tank Tier List for Pugging](https://www.youtube.com/watch?v=N54zknZ2PJs) · July 28 · tanks
- [WoW at Night: Midnight Season 2 Tank Rankings](https://www.youtube.com/watch?v=Fnxt6pCZVgk) · August 7 · tanks

## Reviewed but kept separate

These videos are still part of the source audit, but they are not blended into the manual-play Mythic+ result.

- [The Comeback Kids: Final 12.1 DPS Tier List](https://www.youtube.com/watch?v=h4UnwiKkBbk) · general DPS scope
- [Kiratank_tv: Final Tier List After PTR Testing](https://www.youtube.com/watch?v=uAMS5iVIiDk) · mixed mode
- [AutomaticJak: PTR Raid Healer Tier List](https://www.youtube.com/watch?v=SQyKJx6FEVA) · Raid
- [Andrew T: PTR Raid Tier List](https://www.youtube.com/watch?v=PRYUas-Y2wM) · composition tables rather than a stable tier board
- [Saltii: Ranged Single-Button Assistant Tier List](https://www.youtube.com/watch?v=HagkQsL3GYo) · Assisted Combat
- [Saltii: Melee Single-Button Assistant Tier List](https://www.youtube.com/watch?v=ZasmdZXV2sk) · Assisted Combat
- [Skandar Tank: Final Meta Predictions](https://www.youtube.com/watch?v=lrxuzyd0RHo) · partial meta picks
- [Geezax: Mythic+ DPS Ranking](https://www.youtube.com/watch?v=7XQ_Bku3qF0) · derivative of the Icy Veins and Petko ranking
- [Geezax: Mythic+ Tank and Healer Ranking](https://www.youtube.com/watch?v=uzQF_DHbCng) · derivative of the Icy Veins and Petko ranking
- [CapyQueenVideos: Every Tank and Healer](https://www.youtube.com/watch?v=NxHrTtg4ofk) · summarizes one Icy Veins author
- [Spielbursche: Updated 12.1 Tier List](https://www.youtube.com/watch?v=yudJA7erAtY) · not explicitly Mythic+ scoped
- [Nolifehenry: Official 12.1 Curse of Ula''Tek Tier List](https://www.youtube.com/watch?v=DMjkKEbDVYw) · mixes raid and key discussion
- [Shadarek: Midnight Season 2 Tier List](https://www.youtube.com/watch?v=Z8Jygl_NpF4) · parody list

## Caveats

- PTR tuning can make a ranking stale quickly. Recency weighting reduces that problem but cannot remove it.
- These are creator judgments, not simulations.
- Different videos target different key levels and group assumptions.
- Role-specific lists and all-spec lists create different comparison pools.
- A missing ranking is not treated as a last-place vote.

The workbook keeps the raw tier label, normalized score, publication date, recency weight, evidence timestamp, and full source link for every stored placement.';

-- Why ARPGs Use Leagues and Seasons
UPDATE content
SET markdown = 'I didn’t play the original Path of Exile, but I’ve spent a lot of time with Path of Exile 2 and other action RPGs. Leagues and seasons are common in action RPGs (ARPGs). Starting a new character each season can feel strange if you are coming from a massively multiplayer online RPG (MMORPG).

I also play MMOs, so I understand that reaction. MMO players are accustomed to thinking of their character as a permanent investment. You spend years collecting gear, achievements, cosmetics, mounts, reputations, and other forms of progression. The character itself becomes a long-term identity.

Modern MMOs have become increasingly seasonal too, however. World of Warcraft, for example, now organizes much of its progression around seasons, gear resets, rotating dungeons, and regularly changing reward structures. The reset is not always as complete as it is in an ARPG, but it is trying to solve many of the same problems.

## Games become “solved”

As an ARPG season continues, the game becomes progressively more solved. Players determine which builds are strongest, which skills perform best, which items are most valuable, and which farming strategies produce the greatest rewards. Efficient progression routes are documented, build guides become more refined, and the community gradually learns how to optimize nearly every part of the game.

That discovery process is one of the most enjoyable parts of a new season. Players are experimenting, basic items matter, and unusual drops can be exciting while the new systems are still unfamiliar. Over time, much of that uncertainty disappears.

As strategies become established, players spend more time following guides or refining powerful characters and less time discovering what works. A new league gives players another chance to discover builds and farming routes before guides settle on established choices.

## Seasons create balance points

A seasonal boundary gives developers a less disruptive time for major balance changes. Imagine investing dozens or hundreds of hours into a character only for a mid-season patch to completely break the build. A skill could lose most of its damage, an important item interaction could be removed, or a farming strategy could suddenly stop working.

Sometimes changes like that are unavoidable, particularly when something is bugged or damaging the game. A mid-season nerf can leave a player rebuilding a character they have already spent dozens of hours developing.

Seasonal resets provide a natural breakpoint for larger changes. At the beginning of a new league, developers can make broader adjustments to skills, classes, items, bosses, progression systems, and endgame mechanics. They can introduce experimental features without disrupting an economy and player base that are already deeply established.

Players may not agree with every balance decision, but a fresh start makes larger changes easier to accommodate. Players entering the new season already expect to build another character under its rules.

## The economy becomes saturated

Trade is another major reason ARPGs benefit from resets. At the beginning of a league, even relatively basic items and currencies can have value. Most players are still progressing, strong gear is scarce, and the economy is developing alongside the player base.

As the season continues, wealth accumulates. Established players gain access to increasingly efficient farming strategies. More high-end items enter the market. Common items can lose value as supply grows, while the most desirable equipment can remain expensive.

Someone joining late may be entering an economy shaped by months of accumulated currency, optimized farming, and market knowledge. They are technically playing the same game, but they are not starting from the same position as the players who have been there since launch.

A new league resets that economy. Everyone begins without established wealth, equipment, or market control. Early upgrades matter again, ordinary currency is useful, and players progress through the economy together. It is not a perfectly equal starting line (experienced players will always progress faster), but it is much closer than joining a permanent economy that has been accumulating wealth for years.

## Why make Standard a harder endgame?

One suggestion is that Standard could become an extremely difficult version of the game. Seasonal characters would eventually transfer there, and Standard could offer stronger bosses, extreme difficulty, PvP, or another long-term progression system.

A harder Standard could give completed seasonal characters more to do. It would also raise the difficulty for players who moved there to keep enjoying their old characters.

In leagues that transfer characters, items, and currency to Standard at the end, players can keep using those characters instead of joining the next reset. Check the rules for the particular league.

If Standard were balanced around dramatically greater difficulty, however, many transferred characters would immediately become ineffective. A build that comfortably completed seasonal content might arrive in Standard and suddenly be unable to participate in its intended endgame.

Developers would then have to balance Standard around years of accumulated characters, discontinued mechanics, old equipment, unusual item combinations, and potentially legacy versions of items that no longer exist in current leagues. They would also need to decide what happens when a character transfers from one balance environment into another. Should the character be automatically adjusted? Should its gear be converted? Should Standard have exclusive progression systems and rewards? Should builds be balanced separately for Standard and seasonal play? At that point, the developers would effectively be maintaining two different versions of the game.

## Extreme difficulty does not solve permanent progression

Making the enemies “10,000 times harder” would also not create an endless progression system by itself. Players would eventually solve that version of the game too.

The strongest builds would be identified, the most efficient strategies would spread, and the economy would continue accumulating wealth. Unless Standard also received regular resets or constant power increases, it would eventually reach the same point as any other permanent mode.

Developers could continue adding harder bosses, stronger items, and higher progression tiers, but that introduces another problem: power creep. Each new update would need to provide a meaningful challenge to characters that may have been accumulating power for years. New rewards would have to be stronger than old rewards, which would make earlier content increasingly irrelevant.

MMOs frequently deal with this by introducing new gear tiers and indirectly resetting player power. Even when characters remain permanent, much of their equipment progression is replaced when a new expansion or season begins.

When a new raid or dungeon tier raises the item level ceiling, formerly best-in-slot gear can be replaced by new rewards. The character and old gear remain, but the gear’s advantage shrinks.

## Building the character is much of the experience

The biggest difference between many ARPGs and MMOs is what each genre treats as the central experience. In an MMO, the character is often a persistent platform through which you experience years of content. The character continues, even if its gear and progression systems periodically change.

In an ARPG, building the character is often the main experience. Choosing a class, planning a build, finding upgrades, and solving resource problems make up much of the play. Turning a weak character into a powerful one is a reason to start again.

Once the character is complete, many players feel that the most interesting part of the journey is over. They may continue chasing rare items or defeating harder content, but the frequency of meaningful upgrades steadily declines.

A new season brings back that sense of progression. It gives players a reason to try another class, experiment with a new skill, interact with a different mechanic, or approach the endgame from another direction.

## What you keep from a season

It is understandable to feel that seasonal progress is being devalued. If the main reason you play is to maintain one character indefinitely, the seasonal ARPG model may never feel entirely satisfying. Wanting to keep one character is a reasonable preference.

You can still value a season after its gear stops being current. You learned the game, tested a build, and completed challenges in that version of the league. Those experiences remain even if you start again.

It is similar to finishing a single-player RPG. Completing the game does not make the time spent playing it meaningless. The journey had value even if you later begin another character or move on to another game. Standard gives players a place to preserve and revisit their characters. Making it a much harder mode would change what those players can do with them.

## Seasons are a tradeoff

Seasonal systems are not perfect. They can make players feel pressured to restart. They can reduce the appeal of investing heavily in one character, and they can create the impression that permanent modes are secondary.

The benefit is that seasons allow the game to remain flexible. They reset the economy, refresh progression, create safe points for major balance changes, encourage build experimentation, and give the entire community a reason to return at the same time.

For players coming from MMOs, a league can be a new campaign with a changed ruleset. If you enjoy building a character, a fresh start gives you another chance to do that. If you prefer keeping one character, check what the game’s permanent mode preserves.',
    updated_at = 1790789991154
WHERE slug = 'why-arpgs-use-leagues-and-seasons' AND page_type = 'post' AND status = 'published'
  AND markdown <> 'I didn’t play the original Path of Exile, but I’ve spent a lot of time with Path of Exile 2 and other action RPGs. Leagues and seasons are common in action RPGs (ARPGs). Starting a new character each season can feel strange if you are coming from a massively multiplayer online RPG (MMORPG).

I also play MMOs, so I understand that reaction. MMO players are accustomed to thinking of their character as a permanent investment. You spend years collecting gear, achievements, cosmetics, mounts, reputations, and other forms of progression. The character itself becomes a long-term identity.

Modern MMOs have become increasingly seasonal too, however. World of Warcraft, for example, now organizes much of its progression around seasons, gear resets, rotating dungeons, and regularly changing reward structures. The reset is not always as complete as it is in an ARPG, but it is trying to solve many of the same problems.

## Games become “solved”

As an ARPG season continues, the game becomes progressively more solved. Players determine which builds are strongest, which skills perform best, which items are most valuable, and which farming strategies produce the greatest rewards. Efficient progression routes are documented, build guides become more refined, and the community gradually learns how to optimize nearly every part of the game.

That discovery process is one of the most enjoyable parts of a new season. Players are experimenting, basic items matter, and unusual drops can be exciting while the new systems are still unfamiliar. Over time, much of that uncertainty disappears.

As strategies become established, players spend more time following guides or refining powerful characters and less time discovering what works. A new league gives players another chance to discover builds and farming routes before guides settle on established choices.

## Seasons create balance points

A seasonal boundary gives developers a less disruptive time for major balance changes. Imagine investing dozens or hundreds of hours into a character only for a mid-season patch to completely break the build. A skill could lose most of its damage, an important item interaction could be removed, or a farming strategy could suddenly stop working.

Sometimes changes like that are unavoidable, particularly when something is bugged or damaging the game. A mid-season nerf can leave a player rebuilding a character they have already spent dozens of hours developing.

Seasonal resets provide a natural breakpoint for larger changes. At the beginning of a new league, developers can make broader adjustments to skills, classes, items, bosses, progression systems, and endgame mechanics. They can introduce experimental features without disrupting an economy and player base that are already deeply established.

Players may not agree with every balance decision, but a fresh start makes larger changes easier to accommodate. Players entering the new season already expect to build another character under its rules.

## The economy becomes saturated

Trade is another major reason ARPGs benefit from resets. At the beginning of a league, even relatively basic items and currencies can have value. Most players are still progressing, strong gear is scarce, and the economy is developing alongside the player base.

As the season continues, wealth accumulates. Established players gain access to increasingly efficient farming strategies. More high-end items enter the market. Common items can lose value as supply grows, while the most desirable equipment can remain expensive.

Someone joining late may be entering an economy shaped by months of accumulated currency, optimized farming, and market knowledge. They are technically playing the same game, but they are not starting from the same position as the players who have been there since launch.

A new league resets that economy. Everyone begins without established wealth, equipment, or market control. Early upgrades matter again, ordinary currency is useful, and players progress through the economy together. It is not a perfectly equal starting line (experienced players will always progress faster), but it is much closer than joining a permanent economy that has been accumulating wealth for years.

## Why make Standard a harder endgame?

One suggestion is that Standard could become an extremely difficult version of the game. Seasonal characters would eventually transfer there, and Standard could offer stronger bosses, extreme difficulty, PvP, or another long-term progression system.

A harder Standard could give completed seasonal characters more to do. It would also raise the difficulty for players who moved there to keep enjoying their old characters.

In leagues that transfer characters, items, and currency to Standard at the end, players can keep using those characters instead of joining the next reset. Check the rules for the particular league.

If Standard were balanced around dramatically greater difficulty, however, many transferred characters would immediately become ineffective. A build that comfortably completed seasonal content might arrive in Standard and suddenly be unable to participate in its intended endgame.

Developers would then have to balance Standard around years of accumulated characters, discontinued mechanics, old equipment, unusual item combinations, and potentially legacy versions of items that no longer exist in current leagues. They would also need to decide what happens when a character transfers from one balance environment into another. Should the character be automatically adjusted? Should its gear be converted? Should Standard have exclusive progression systems and rewards? Should builds be balanced separately for Standard and seasonal play? At that point, the developers would effectively be maintaining two different versions of the game.

## Extreme difficulty does not solve permanent progression

Making the enemies “10,000 times harder” would also not create an endless progression system by itself. Players would eventually solve that version of the game too.

The strongest builds would be identified, the most efficient strategies would spread, and the economy would continue accumulating wealth. Unless Standard also received regular resets or constant power increases, it would eventually reach the same point as any other permanent mode.

Developers could continue adding harder bosses, stronger items, and higher progression tiers, but that introduces another problem: power creep. Each new update would need to provide a meaningful challenge to characters that may have been accumulating power for years. New rewards would have to be stronger than old rewards, which would make earlier content increasingly irrelevant.

MMOs frequently deal with this by introducing new gear tiers and indirectly resetting player power. Even when characters remain permanent, much of their equipment progression is replaced when a new expansion or season begins.

When a new raid or dungeon tier raises the item level ceiling, formerly best-in-slot gear can be replaced by new rewards. The character and old gear remain, but the gear’s advantage shrinks.

## Building the character is much of the experience

The biggest difference between many ARPGs and MMOs is what each genre treats as the central experience. In an MMO, the character is often a persistent platform through which you experience years of content. The character continues, even if its gear and progression systems periodically change.

In an ARPG, building the character is often the main experience. Choosing a class, planning a build, finding upgrades, and solving resource problems make up much of the play. Turning a weak character into a powerful one is a reason to start again.

Once the character is complete, many players feel that the most interesting part of the journey is over. They may continue chasing rare items or defeating harder content, but the frequency of meaningful upgrades steadily declines.

A new season brings back that sense of progression. It gives players a reason to try another class, experiment with a new skill, interact with a different mechanic, or approach the endgame from another direction.

## What you keep from a season

It is understandable to feel that seasonal progress is being devalued. If the main reason you play is to maintain one character indefinitely, the seasonal ARPG model may never feel entirely satisfying. Wanting to keep one character is a reasonable preference.

You can still value a season after its gear stops being current. You learned the game, tested a build, and completed challenges in that version of the league. Those experiences remain even if you start again.

It is similar to finishing a single-player RPG. Completing the game does not make the time spent playing it meaningless. The journey had value even if you later begin another character or move on to another game. Standard gives players a place to preserve and revisit their characters. Making it a much harder mode would change what those players can do with them.

## Seasons are a tradeoff

Seasonal systems are not perfect. They can make players feel pressured to restart. They can reduce the appeal of investing heavily in one character, and they can create the impression that permanent modes are secondary.

The benefit is that seasons allow the game to remain flexible. They reset the economy, refresh progression, create safe points for major balance changes, encourage build experimentation, and give the entire community a reason to return at the same time.

For players coming from MMOs, a league can be a new campaign with a changed ruleset. If you enjoy building a character, a fresh start gives you another chance to do that. If you prefer keeping one character, check what the game’s permanent mode preserves.';

-- WoW "Best in Slot" Lists Are Bait: Stop Chasing Them Blindly
UPDATE content
SET markdown = 'If you play World of Warcraft, you’ve probably used a “Best in Slot” list to decide what to farm.

A list gives you a clear target, which is useful when you’re deciding where to spend your time.

A best-in-slot (BIS) list describes a particular gear setup. An item that sims best in that setup can be worse for your current character than an item left off the list. Your equipped gear changes the value of the next upgrade.

Following the list blindly can lead you to pass on upgrades and spend weeks chasing an item that does little for your current setup.

## Why BIS lists break down

A BIS list assumes:

- A specific full gear configuration
- Specific embellishments
- Specific trinket combinations
- Specific tier pieces
- Specific secondary stat distributions
- Often specific encounter profiles

Your character may not match that setup.

You might have a different mix of Haste, Crit, and Mastery, be missing a tier bonus, or use different trinkets and crafted gear. Those differences can change which item is an upgrade.

## Stat weights change with your setup

A stat weight such as “Versatility is worth 1.3 DPS per point” describes a particular simulated setup. It is not a permanent value for the stat.

Stat weights estimate the value of a small stat change in the simulated setup. They can change when you swap gear, and a lower weight does not follow automatically from having more of that stat.

Suppose a character has these stats:

| Stat | Amount |
|---|---:|
| Crit | 20% |
| Haste | 32% |
| Mastery | 18% |
| Vers | 12% |

For this example, assume these weights:

| Stat | Relative Value |
|---|---:|
| Crit | 1.25 |
| Mastery | 1.18 |
| Vers | 1.10 |
| Haste | 0.84 |

The assumed weights favor other stats over Haste.

The percentages alone do not establish those weights. These are invented values for the example, not a result for a real specialization.

## Comparing two rings

Now imagine a BIS list says this ring is optimal:

| Item | Stats |
|---|---|
| Ring A | +1200 Haste / +800 Vers |

Your current ring is:

| Item | Stats |
|---|---|
| Ring B | +1100 Crit / +850 Mastery |

Multiplying each stat amount by its assumed weight gives these scores:

### Ring A

```text
1200 × 0.84 + 800 × 1.10 = 1888
```

### Ring B

```text
1100 × 1.25 + 850 × 1.18 = 2378
```

Ring B has the higher score under these assumed weights. That arithmetic does not establish which ring would produce more damage in a direct simulation.

Use a direct gear comparison to check whether the apparent upgrade holds up.

## Secondary stats interact

Changing one stat can change the value of others, so “always stack X” is too broad to settle an item comparison.

A stat priority is a starting point. It does not replace comparing the complete gear combinations available to you.

A simplified conceptual example might look like this:

| Haste % | Marginal Value |
|---|---:|
| 10% | 1.30 |
| 20% | 1.18 |
| 30% | 0.96 |
| 40% | 0.79 |

These values illustrate a possible curve, not a universal Haste rule or a measured result.

## Trinket interactions

Trinkets complicate this even further because many of them:

- Scale differently with stats
- Interact with cooldown timings
- Alter rotational flow
- Have proc overlap behavior
- Gain or lose value based on encounter type

An unusually strong trinket may remain a good choice across many setups, but that still needs checking for your specialization and encounter.

A trinket that sims #1 in a theoretical full BIS profile might be mediocre in your actual loadout because:

- You lack supporting stats
- Your cooldown timings differ
- Your current trinket pairing changes proc alignment
- Your specialization scaling differs at your current gear level

## Compare gear for your character

Start with a SimulationCraft export of your current character. Use Raidbots Top Gear to compare items you own and Droptimizer to compare drops you could farm. Quick Sim gives you a result for a single setup; Gear Compare is another comparison tool.

Raidbots recommends direct comparisons with Top Gear or Droptimizer over relying on stat weights. Its [explanation of stat-weight limitations](https://support.raidbots.com/article/66-beware-of-stat-weights) shows why weights can change after a gear swap.

Use your current gear, trinkets, tier set, and embellishments in the comparison.

Use those results to decide what to equip or farm next.

## Comparing two cloaks

Imagine two cloaks drop.

### Cloak A

- +1400 Haste
- +900 Vers

### Cloak B

- +1000 Crit
- +1200 Mastery

If your current stat weights are:

| Stat | Value |
|---|---:|
| Crit | 1.22 |
| Mastery | 1.19 |
| Vers | 1.01 |
| Haste | 0.81 |

Then:

### Cloak A

```text
1400 × 0.81 + 900 × 1.01 = 2043
```

### Cloak B

```text
1000 × 1.22 + 1200 × 1.19 = 2648
```

Cloak B scores higher under the assumed weights. As with the rings, this is illustrative arithmetic, not a simulation result. Check the complete items before deciding what to equip.

## Why a checklist can limit your choices

A BIS list gives you a checklist and a way to track progress. The risk is becoming so focused on a dungeon drop, raid boss, or Vault target that you overlook an upgrade you already have.

## What to do instead

Use BIS lists to identify items worth investigating, especially weapons and trinkets. Then compare those items with your own setup:

1. Export your current character with SimulationCraft.
2. Use Top Gear to compare the items you own, especially after a major upgrade.
3. Use Droptimizer to choose which upgrade sources to farm.
4. Recheck the comparison when your gear, tier set, or trinket pairing changes.

A listed item is a candidate to compare. Take the upgrade that works for your current setup, and check again when that setup changes.',
    updated_at = 1790789991154
WHERE slug = 'bis-lists-are-bait' AND page_type = 'post' AND status = 'published'
  AND markdown <> 'If you play World of Warcraft, you’ve probably used a “Best in Slot” list to decide what to farm.

A list gives you a clear target, which is useful when you’re deciding where to spend your time.

A best-in-slot (BIS) list describes a particular gear setup. An item that sims best in that setup can be worse for your current character than an item left off the list. Your equipped gear changes the value of the next upgrade.

Following the list blindly can lead you to pass on upgrades and spend weeks chasing an item that does little for your current setup.

## Why BIS lists break down

A BIS list assumes:

- A specific full gear configuration
- Specific embellishments
- Specific trinket combinations
- Specific tier pieces
- Specific secondary stat distributions
- Often specific encounter profiles

Your character may not match that setup.

You might have a different mix of Haste, Crit, and Mastery, be missing a tier bonus, or use different trinkets and crafted gear. Those differences can change which item is an upgrade.

## Stat weights change with your setup

A stat weight such as “Versatility is worth 1.3 DPS per point” describes a particular simulated setup. It is not a permanent value for the stat.

Stat weights estimate the value of a small stat change in the simulated setup. They can change when you swap gear, and a lower weight does not follow automatically from having more of that stat.

Suppose a character has these stats:

| Stat | Amount |
|---|---:|
| Crit | 20% |
| Haste | 32% |
| Mastery | 18% |
| Vers | 12% |

For this example, assume these weights:

| Stat | Relative Value |
|---|---:|
| Crit | 1.25 |
| Mastery | 1.18 |
| Vers | 1.10 |
| Haste | 0.84 |

The assumed weights favor other stats over Haste.

The percentages alone do not establish those weights. These are invented values for the example, not a result for a real specialization.

## Comparing two rings

Now imagine a BIS list says this ring is optimal:

| Item | Stats |
|---|---|
| Ring A | +1200 Haste / +800 Vers |

Your current ring is:

| Item | Stats |
|---|---|
| Ring B | +1100 Crit / +850 Mastery |

Multiplying each stat amount by its assumed weight gives these scores:

### Ring A

```text
1200 × 0.84 + 800 × 1.10 = 1888
```

### Ring B

```text
1100 × 1.25 + 850 × 1.18 = 2378
```

Ring B has the higher score under these assumed weights. That arithmetic does not establish which ring would produce more damage in a direct simulation.

Use a direct gear comparison to check whether the apparent upgrade holds up.

## Secondary stats interact

Changing one stat can change the value of others, so “always stack X” is too broad to settle an item comparison.

A stat priority is a starting point. It does not replace comparing the complete gear combinations available to you.

A simplified conceptual example might look like this:

| Haste % | Marginal Value |
|---|---:|
| 10% | 1.30 |
| 20% | 1.18 |
| 30% | 0.96 |
| 40% | 0.79 |

These values illustrate a possible curve, not a universal Haste rule or a measured result.

## Trinket interactions

Trinkets complicate this even further because many of them:

- Scale differently with stats
- Interact with cooldown timings
- Alter rotational flow
- Have proc overlap behavior
- Gain or lose value based on encounter type

An unusually strong trinket may remain a good choice across many setups, but that still needs checking for your specialization and encounter.

A trinket that sims #1 in a theoretical full BIS profile might be mediocre in your actual loadout because:

- You lack supporting stats
- Your cooldown timings differ
- Your current trinket pairing changes proc alignment
- Your specialization scaling differs at your current gear level

## Compare gear for your character

Start with a SimulationCraft export of your current character. Use Raidbots Top Gear to compare items you own and Droptimizer to compare drops you could farm. Quick Sim gives you a result for a single setup; Gear Compare is another comparison tool.

Raidbots recommends direct comparisons with Top Gear or Droptimizer over relying on stat weights. Its [explanation of stat-weight limitations](https://support.raidbots.com/article/66-beware-of-stat-weights) shows why weights can change after a gear swap.

Use your current gear, trinkets, tier set, and embellishments in the comparison.

Use those results to decide what to equip or farm next.

## Comparing two cloaks

Imagine two cloaks drop.

### Cloak A

- +1400 Haste
- +900 Vers

### Cloak B

- +1000 Crit
- +1200 Mastery

If your current stat weights are:

| Stat | Value |
|---|---:|
| Crit | 1.22 |
| Mastery | 1.19 |
| Vers | 1.01 |
| Haste | 0.81 |

Then:

### Cloak A

```text
1400 × 0.81 + 900 × 1.01 = 2043
```

### Cloak B

```text
1000 × 1.22 + 1200 × 1.19 = 2648
```

Cloak B scores higher under the assumed weights. As with the rings, this is illustrative arithmetic, not a simulation result. Check the complete items before deciding what to equip.

## Why a checklist can limit your choices

A BIS list gives you a checklist and a way to track progress. The risk is becoming so focused on a dungeon drop, raid boss, or Vault target that you overlook an upgrade you already have.

## What to do instead

Use BIS lists to identify items worth investigating, especially weapons and trinkets. Then compare those items with your own setup:

1. Export your current character with SimulationCraft.
2. Use Top Gear to compare the items you own, especially after a major upgrade.
3. Use Droptimizer to choose which upgrade sources to farm.
4. Recheck the comparison when your gear, tier set, or trinket pairing changes.

A listed item is a candidate to compare. Take the upgrade that works for your current setup, and check again when that setup changes.';
