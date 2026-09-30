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
  'e33f9f37-80f4-4fe6-8cca-c870946bdc59',
  'bis-lists-are-bait',
  'WoW "Best in Slot" Lists Are Bait — Stop Chasing Them Blindly',
  'If you play World of Warcraft, you’ve probably used a “Best in Slot” list to decide what to farm.

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
  'post',
  'published',
  (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1),
  CAST(strftime('%s', '2026-05-06 12:00:00') AS INTEGER) * 1000,
  CAST(strftime('%s', '2026-05-06 12:00:00') AS INTEGER) * 1000,
  CAST(strftime('%s', '2026-05-06 12:00:00') AS INTEGER) * 1000,
  'https://media.orboro.net/images/bis-lists-are-bait-header.webp'
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  markdown = excluded.markdown,
  page_type = excluded.page_type,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = excluded.updated_at,
  featured_image_url = excluded.featured_image_url;

INSERT OR IGNORE INTO content_categories (content_id, category_id)
SELECT
  (SELECT id FROM content WHERE slug = 'bis-lists-are-bait'),
  id
FROM categories
WHERE slug IN ('gaming', 'world-of-warcraft');

