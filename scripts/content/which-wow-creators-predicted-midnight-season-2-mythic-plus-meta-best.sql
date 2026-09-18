PRAGMA foreign_keys = ON;

INSERT INTO content (
  id,
  slug,
  title,
  markdown,
  page_type,
  status,
  author_id,
  published_at,
  created_at,
  updated_at,
  featured_image_url
)
VALUES (
  'f08a757c-e6c0-4e8c-b2d9-81022f8bcedf',
  'which-wow-creators-predicted-midnight-season-2-mythic-plus-meta-best',
  'Which WoW Creators Predicted the Midnight Season 2 Mythic+ Meta Best?',
  'Tier lists are easy to grade with hindsight and hard to make before a live meta is visible. Most creators were working from PTR testing, unfinished tuning, a new dungeon pool, and no live-key evidence. Five weeks into Midnight Season 2, we finally have enough data to ask a fairer question: whose substantial early forecast looks most like the high-key meta that actually formed?

This is a follow-up to my [pre-season creator aggregate](https://orboro.net/blog/what-wow-creators-think-is-strong-in-mythic-plus-for-midnight-season-2). That article combined lists to find consensus. This one turns the comparison around. I reviewed the original sources, added new full-board forecasts, recorded each creator''s actual tiers, and compared every qualifying prediction with the same five-week MythicStats benchmark.

The result is not a dunk list. Predicting Blood Death Knight, Holy Paladin, Arms Warrior, and Arcane Mage near the top was the easy part in retrospect. Predicting the exact order through 40 specs before our live-meta benchmark existed was not.

> Eligibility: the forecast had to be published before the first MythicStats benchmark capture, explicitly cover Mythic+, and rank at least 26 of the 40 specs. A complete 26- or 27-spec DPS board counts as “most specs.” Short six- or seven-spec tank and healer lists remain useful source material, but they are not placed on this leaderboard.

[Open the complete prediction review workbook](https://docs.google.com/spreadsheets/d/1SRv8znRSX1AWqOHHtU_PKyKqqQG7ldOu0Q6p944P1-0/edit?gid=0#gid=0). It contains the leaderboard, the five-week meta benchmark, a plain-language method tab, and one tab per creator with the extracted tier list and every per-spec comparison.

## Creator prediction accuracy tier list

{{midnight_creator_accuracy_tier_list}}

No creator reached A or S. That does not mean the B-tier forecasts were bad. On this scale, a B means the board retained a meaningful resemblance to the final ordering after every miss across an entire role was counted. The first five weeks also became much more concentrated than most reasonable pre-season lists suggested.

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

That is why this comparison grades ordering, not whether somebody used the word “strong.” A board can identify several good specs and still miss how sharply the high-key field concentrates around a few of them.

## How the score works

Different creators used different labels. One board might use S through D, another might use S+, S, A+, and A, and another might use descriptive groups. Comparing the letters directly would reward formatting choices instead of predictions, so every board goes through the same normalization.

1. **Qualify the forecast.** It must predate the first MythicStats benchmark capture, explicitly cover Mythic+, and rank at least 26 specs.
2. **Keep the creator''s own tiers and ties.** Specs in the same tier stay tied.
3. **Normalize the prediction inside each role.** The top predicted position becomes 100, the bottom becomes 0, and tied specs share the midpoint of the positions they occupy.
4. **Build the actual five-week ordering.** Each spec''s MythicStats representation is averaged across periods 1077 to 1081, then converted to the same within-role 0 to 100 scale.
5. **Measure every miss.** Per-spec error is the absolute difference between the prediction percentile and the actual percentile.
6. **Score each role.** Role accuracy is `max(0, 100 - 2 × mean absolute error)`.
7. **Weight roles equally.** A full board''s tank, healer, and DPS scores each contribute one-third. The 27 DPS specs cannot drown out the smaller tank and healer pools.
8. **Apply a small coverage adjustment.** Final accuracy is `raw agreement × [0.85 + 0.15 × (ranked specs ÷ 40)]`.

A complete 40-spec board keeps 100% of its raw score. A 27-spec DPS board keeps 95.1%, and a 26-spec board keeps 94.8%. This lets substantial DPS forecasts compete without pretending that ranking one role is exactly the same assignment as ranking all three.

For a simple example, suppose a spec was predicted at the 80th percentile and finished at the 60th. Its error is 20 points. If every spec in that role averaged a 15-point error, the role score would be `100 - 2 × 15 = 70`. If that came from a 27-spec board, the final would be `70 × 95.1% = 66.6`.

The grade bands are:

- S: 80 to 100
- A: 65 to 79.9
- B: 50 to 64.9
- C: 35 to 49.9
- D: below 35

The workbook''s **Method** tab shows the same calculation step by step, and every creator tab exposes the normalized prediction, actual percentile, and absolute error used in the score.

## Notes on the 13 qualifying forecasts

- **izen** ranked all 40 specs in a final pre-season video and finished first with the most consistent scores across all three roles.
- **YoDaTV** ranked 35 specs. The tank board was the strongest role prediction in this comparison, while the healer ordering was less accurate.
- **Petko** is represented by the final August 9 progressive tier list, not an earlier update. All 40 specs are recorded from that final board.
- **Tactyks / Method** adds a full written forecast to a source set otherwise dominated by videos. It was updated August 13 and ranked all 40 specs.
- **Dorki** published a complete 40-spec video board on August 19, before the first MythicStats benchmark capture. His 63.0 DPS score was the strongest part of a 58.4 overall result.
- **Tettles** ranked all 27 DPS specs and placed sixth after the coverage adjustment.
- **Naowh / Robin panel** ranked every spec and was strongest on DPS.
- **zor thas** ranked all 40 specs. The DPS ordering scored well, but the tank ordering lowered the full-board result.
- **Saltii** published separate melee and ranged videos. I combined those two boards into one complete 27-spec DPS forecast before scoring it.
- **mulltiy** ranked 26 DPS specs. One explicitly unranked spec was omitted instead of being silently treated as last.
- **Casualaddict** covered all 27 DPS specs in a pre-tuning Twitch VOD upload.
- **Chorsh** ranked 36 specs and receives only a very small coverage adjustment.
- **Kushi** ranked all 40 specs. The DPS board retained some agreement, but large tank and healer misses pulled down the equal-role result.

## Why shorter role lists are still kept separate

The original research included useful specialist forecasts from tank and healer creators. They remain in the source audit and still help explain pre-season consensus. They are not ranked here because a six-spec tank board or seven-spec healer board has far fewer opportunities to be wrong than a 26- to 40-spec forecast.

The 26-spec cutoff is not magic. It is a transparent compromise: include complete or nearly complete DPS boards, require broad public calls, and avoid a leaderboard where somebody can win by only naming a handful of favorites.

## What this score does and does not say

MythicStats representation is a picture of what the high-key field selected and completed with. It is not a simulation of theoretical damage, healing, survivability, or ordinary-pug success. Popularity, title-range key pressure, coordinated composition, community perception, and tuning all affect representation.

This is also an early-season checkpoint. Later tuning can make a week-five forecast look better or worse. The result answers one narrow question: **whose substantial pre-benchmark Mythic+ ordering most closely resembled the first five weeks of the high-key meta?**

For the complete written record, use the [shared prediction review workbook](https://docs.google.com/spreadsheets/d/1SRv8znRSX1AWqOHHtU_PKyKqqQG7ldOu0Q6p944P1-0/edit?gid=0#gid=0). For the underlying weekly representation, see [MythicStats](https://mythicstats.com/).',
  'post',
  'published',
  (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1),
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  '/images/which-wow-creators-predicted-midnight-season-2-mythic-plus-meta-best-header.webp'
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  markdown = excluded.markdown,
  page_type = excluded.page_type,
  status = excluded.status,
  published_at = COALESCE(content.published_at, excluded.published_at),
  updated_at = excluded.updated_at,
  featured_image_url = excluded.featured_image_url;

INSERT OR IGNORE INTO content_categories (content_id, category_id)
SELECT
  (SELECT id FROM content WHERE slug = 'which-wow-creators-predicted-midnight-season-2-mythic-plus-meta-best'),
  id
FROM categories
WHERE slug IN ('gaming', 'world-of-warcraft');
