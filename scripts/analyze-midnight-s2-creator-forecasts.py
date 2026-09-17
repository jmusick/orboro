"""Score archived Season 2 creator tier boards against MythicStats weeks 1-5.

Pass the exported original Google Sheet as the positional argument. The script
retrieves only the public MythicStats period pages and prints a TSV suitable for
the follow-up research sheet.
"""

from __future__ import annotations

import collections
import csv
from datetime import date, timedelta
import json
from pathlib import Path
import re
import sys
import urllib.request

ROLE_BY_SPEC = {
    "blood death knight": "Tank", "brewmaster monk": "Tank",
    "guardian druid": "Tank", "protection paladin": "Tank",
    "protection warrior": "Tank", "vengeance demon hunter": "Tank",
    "discipline priest": "Healer", "holy paladin": "Healer",
    "holy priest": "Healer", "mistweaver monk": "Healer",
    "preservation evoker": "Healer", "restoration druid": "Healer",
    "restoration shaman": "Healer",
}

ALL_SPECS = {
    "affliction warlock", "arcane mage", "arms warrior", "assassination rogue",
    "augmentation evoker", "balance druid", "beast mastery hunter",
    "blood death knight", "brewmaster monk", "demonology warlock",
    "destruction warlock", "devastation evoker", "devourer demon hunter",
    "discipline priest", "elemental shaman", "enhancement shaman", "feral druid",
    "fire mage", "frost death knight", "frost mage", "fury warrior",
    "guardian druid", "havoc demon hunter", "holy paladin", "holy priest",
    "marksmanship hunter", "mistweaver monk", "outlaw rogue",
    "preservation evoker", "protection paladin", "protection warrior",
    "restoration druid", "restoration shaman", "retribution paladin",
    "shadow priest", "subtlety rogue", "survival hunter", "unholy death knight",
    "vengeance demon hunter", "windwalker monk",
}


def canonical_spec(spec: str) -> str:
    return spec.lower().replace("-", " ")


def role_for(spec: str) -> str:
    return ROLE_BY_SPEC.get(canonical_spec(spec), "DPS")


def source_date(value: str) -> str:
    """Return an ISO date from an ISO string or an Excel serial date."""
    try:
        return (date(1899, 12, 30) + timedelta(days=float(value))).isoformat()
    except ValueError:
        return value[:10]


def tier_board(*rows: tuple[str, list[str]]) -> dict[str, dict[str, float]]:
    """Return role-separated ordinal placements from a tier board."""
    by_role: dict[str, dict[str, float]] = collections.defaultdict(dict)
    for order, (_, specs) in enumerate(rows, start=1):
        for spec in specs:
            by_role[role_for(spec)][canonical_spec(spec)] = float(order)
    return by_role


MANUAL_SOURCES = {
    "PETKO-2026-08-09-FINAL": {
        "creator": "Petko",
        "title": "Progressive M+ TIERLIST | THE FINAL Pre-S2 Update - Midnight S2 - | Patch 12.1",
        "url": "https://www.youtube.com/watch?v=bUlSIg2dFCI",
        "published": "2026-08-09",
        "mode": "Mythic+",
        "scope": "All specs",
        "source_format": "Video",
        "tiers": tier_board(
            ("S+", ["Arcane Mage", "Arms Warrior", "Blood Death Knight", "Holy Paladin"]),
            ("Alternative S", ["Restoration Shaman", "Outlaw Rogue", "Windwalker Monk"]),
            ("A+", ["Shadow Priest", "Elemental Shaman", "Unholy Death Knight", "Devourer Demon Hunter", "Frost Death Knight", "Balance Druid", "Destruction Warlock", "Retribution Paladin", "Protection Paladin", "Vengeance Demon Hunter", "Guardian Druid"]),
            ("Dark horse", ["Preservation Evoker"]),
            ("A", ["Enhancement Shaman", "Havoc Demon Hunter", "Fire Mage", "Assassination Rogue", "Fury Warrior", "Demonology Warlock", "Affliction Warlock", "Feral Druid", "Protection Warrior", "Mistweaver Monk"]),
            ("B", ["Subtlety Rogue", "Discipline Priest", "Brewmaster Monk", "Survival Hunter", "Marksmanship Hunter", "Frost Mage"]),
            ("C", ["Beast Mastery Hunter", "Devastation Evoker", "Holy Priest", "Restoration Druid", "Augmentation Evoker"]),
        ),
    },
    "ZORTHAS-2026-08-09": {
        "creator": "zor thas",
        "title": "FINAL TIER LIST for Season 2 M+ Midnight",
        "url": "https://www.youtube.com/watch?v=SV3Snl21XC8",
        "published": "2026-08-09",
        "mode": "Mythic+",
        "scope": "All specs",
        "tiers": tier_board(
            ("S", ["Blood Death Knight"]),
            ("S (one or both)", ["Arcane Mage", "Arms Warrior"]),
            ("A+", ["Devourer Demon Hunter", "Elemental Shaman", "Balance Druid", "Unholy Death Knight", "Frost Death Knight", "Holy Paladin", "Restoration Shaman"]),
            ("A-", ["Subtlety Rogue", "Outlaw Rogue", "Windwalker Monk", "Assassination Rogue", "Protection Paladin", "Vengeance Demon Hunter", "Preservation Evoker"]),
            ("B", ["Enhancement Shaman", "Feral Druid", "Destruction Warlock", "Demonology Warlock", "Havoc Demon Hunter", "Retribution Paladin", "Augmentation Evoker", "Marksmanship Hunter", "Shadow Priest", "Fury Warrior", "Guardian Druid", "Protection Warrior", "Mistweaver Monk"]),
            ("C", ["Affliction Warlock", "Beast Mastery Hunter", "Survival Hunter", "Frost Mage", "Brewmaster Monk", "Discipline Priest", "Restoration Druid"]),
            ("D", ["Fire Mage", "Devastation Evoker", "Holy Priest"]),
        ),
    },
    "NAOWH-ROBIN-2026-08-10": {
        "creator": "Naowh / Robin panel",
        "title": "WoW's Best Players Rank EVERY Spec for M+ Midnight Season 2",
        "url": "https://www.youtube.com/watch?v=LLe9lSftDRs",
        "published": "2026-08-10",
        "mode": "Mythic+",
        "scope": "All specs",
        "tiers": tier_board(
            ("S+ (Meta)", ["Blood Death Knight", "Holy Paladin", "Arcane Mage", "Arms Warrior"]),
            ("S- (Meta fillers)", ["Protection Paladin", "Restoration Shaman", "Subtlety Rogue", "Balance Druid", "Elemental Shaman", "Devourer Demon Hunter", "Windwalker Monk", "Frost Death Knight", "Unholy Death Knight"]),
            ("A (Strong but not meta)", ["Vengeance Demon Hunter", "Guardian Druid", "Enhancement Shaman", "Preservation Evoker", "Assassination Rogue", "Outlaw Rogue", "Feral Druid"]),
            ("B (Mid)", ["Havoc Demon Hunter", "Retribution Paladin", "Brewmaster Monk", "Protection Warrior", "Augmentation Evoker", "Demonology Warlock", "Destruction Warlock", "Survival Hunter", "Restoration Druid", "Discipline Priest", "Beast Mastery Hunter", "Mistweaver Monk", "Affliction Warlock", "Shadow Priest"]),
            ("C (Works if you love the spec)", ["Frost Mage", "Holy Priest", "Marksmanship Hunter", "Fury Warrior"]),
            ("F (Send help)", ["Fire Mage", "Devastation Evoker"]),
        ),
    },
    "IZEN-2026-08-16": {
        "creator": "izen",
        "title": "DPS, Tanks & Healers Meta in Season 2 | Official Final Definitive Season 2 Mythic+ Tier List",
        "url": "https://www.youtube.com/watch?v=KktdoK1OZVY",
        "published": "2026-08-16",
        "mode": "Mythic+",
        "scope": "All specs",
        "source_format": "Video",
        "tiers": tier_board(
            ("S", ["Blood Death Knight", "Holy Paladin", "Arcane Mage", "Arms Warrior"]),
            ("A", ["Protection Paladin", "Vengeance Demon Hunter", "Guardian Druid", "Restoration Shaman", "Elemental Shaman", "Devourer Demon Hunter", "Balance Druid", "Windwalker Monk", "Outlaw Rogue"]),
            ("B", ["Protection Warrior", "Preservation Evoker", "Mistweaver Monk", "Unholy Death Knight", "Shadow Priest", "Retribution Paladin", "Frost Death Knight", "Subtlety Rogue", "Marksmanship Hunter"]),
            ("C", ["Brewmaster Monk", "Discipline Priest", "Feral Druid", "Havoc Demon Hunter", "Enhancement Shaman", "Destruction Warlock", "Assassination Rogue"]),
            ("D", ["Holy Priest", "Restoration Druid", "Affliction Warlock", "Demonology Warlock", "Augmentation Evoker", "Beast Mastery Hunter", "Survival Hunter", "Fury Warrior", "Fire Mage", "Frost Mage", "Devastation Evoker"]),
        ),
    },
    "TACTYKS-METHOD-2026-08-13": {
        "creator": "Tactyks / Method",
        "title": "World of Warcraft Mythic+ Tier List",
        "url": "https://www.method.gg/guides/tier-list/mythic-plus",
        "published": "2026-08-13",
        "mode": "Mythic+",
        "scope": "All specs",
        "source_format": "Written",
        "tiers": tier_board(
            ("S", ["Blood Death Knight", "Holy Paladin"]),
            ("A", ["Protection Paladin", "Vengeance Demon Hunter", "Guardian Druid", "Restoration Shaman", "Arcane Mage", "Balance Druid", "Devourer Demon Hunter", "Elemental Shaman", "Destruction Warlock", "Frost Death Knight", "Windwalker Monk", "Arms Warrior", "Outlaw Rogue"]),
            ("B", ["Protection Warrior", "Brewmaster Monk", "Preservation Evoker", "Discipline Priest", "Mistweaver Monk", "Restoration Druid", "Demonology Warlock", "Frost Mage", "Devastation Evoker", "Shadow Priest", "Marksmanship Hunter", "Beast Mastery Hunter", "Survival Hunter", "Feral Druid", "Havoc Demon Hunter", "Unholy Death Knight", "Enhancement Shaman", "Retribution Paladin", "Assassination Rogue", "Subtlety Rogue", "Fury Warrior"]),
            ("C", ["Holy Priest", "Affliction Warlock", "Fire Mage", "Augmentation Evoker"]),
        ),
    },
    "DORKI-2026-08-19": {
        "creator": "Dorki",
        "title": "OFFICIAL SEASON 2 M+ TIER LIST | Midnight 12.1",
        "url": "https://www.youtube.com/watch?v=3r_vwmTUZXs",
        "published": "2026-08-19",
        "mode": "Mythic+",
        "scope": "All specs",
        "source_format": "Video",
        "tiers": tier_board(
            ("S (Strongest I've seen)", ["Blood Death Knight", "Elemental Shaman", "Arms Warrior"]),
            ("A (Meta contenders)", ["Devourer Demon Hunter", "Preservation Evoker", "Holy Paladin", "Restoration Shaman", "Guardian Druid", "Protection Paladin", "Vengeance Demon Hunter", "Balance Druid", "Outlaw Rogue", "Subtlety Rogue", "Assassination Rogue", "Arcane Mage", "Enhancement Shaman", "Windwalker Monk", "Unholy Death Knight", "Frost Death Knight"]),
            ("B (Mid)", ["Feral Druid", "Holy Priest", "Discipline Priest", "Mistweaver Monk", "Protection Warrior", "Brewmaster Monk", "Demonology Warlock", "Destruction Warlock", "Affliction Warlock", "Havoc Demon Hunter"]),
            ("C (Suck)", ["Retribution Paladin", "Shadow Priest", "Augmentation Evoker", "Marksmanship Hunter", "Beast Mastery Hunter", "Devastation Evoker"]),
            ("Unknown (No one plays this)", ["Restoration Druid", "Fury Warrior", "Frost Mage", "Fire Mage", "Survival Hunter"]),
        ),
    },
}

MANUAL_TIER_LABELS = {
    "ZORTHAS-2026-08-09": {
        1: "S", 2: "S (one or both)", 3: "A+", 4: "A-", 5: "B", 6: "C", 7: "D",
    },
    "NAOWH-ROBIN-2026-08-10": {
        1: "S+ (Meta)", 2: "S- (Meta fillers)", 3: "A (Strong but not meta)",
        4: "B (Mid)", 5: "C (Works if you love the spec)", 6: "F (Send help)",
    },
    "PETKO-2026-08-09-FINAL": {
        1: "S+", 2: "Alternative S", 3: "A+", 4: "Dark horse",
        5: "A", 6: "B", 7: "C",
    },
    "IZEN-2026-08-16": {1: "S", 2: "A", 3: "B", 4: "C", 5: "D"},
    "TACTYKS-METHOD-2026-08-13": {1: "S", 2: "A", 3: "B", 4: "C"},
    "DORKI-2026-08-19": {
        1: "S (Strongest I've seen)", 2: "A (Meta contenders)",
        3: "B (Mid)", 4: "C (Suck)", 5: "Unknown (No one plays this)",
    },
}
for manual_source_id, manual_source in MANUAL_SOURCES.items():
    label_by_order = MANUAL_TIER_LABELS[manual_source_id]
    manual_source["labels"] = {
        spec: label_by_order[int(order)]
        for predictions in manual_source["tiers"].values()
        for spec, order in predictions.items()
    }


def midrank_percentiles(values: dict[str, float], reverse: bool = True) -> dict[str, float]:
    """Convert values to 0-100 midrank percentiles, preserving ties."""
    ordered = sorted(values.items(), key=lambda pair: pair[1], reverse=reverse)
    count = len(ordered)
    if count < 2:
        return {name: 100.0 for name in values}
    result: dict[str, float] = {}
    index = 0
    while index < count:
        end = index + 1
        while end < count and ordered[end][1] == ordered[index][1]:
            end += 1
        # One-based rank, averaged across a tied block.
        rank = ((index + 1) + end) / 2
        score = 100 * (count - rank) / (count - 1)
        for name, _ in ordered[index:end]:
            result[name] = score
        index = end
    return result


def mythicstats_actual() -> dict[str, float]:
    headers = {"User-Agent": "Mozilla/5.0"}
    observations: dict[str, list[float]] = collections.defaultdict(list)
    for period in range(1077, 1082):
        request = urllib.request.Request(
            f"https://mythicstats.com/period/{period}", headers=headers
        )
        html = urllib.request.urlopen(request).read().decode()
        section = html.split("Spec representation in top keys", 1)[1].split(
            "Classes and specs", 1
        )[0]
        specs = re.findall(r'alt="([^"]+)"', section)
        values = re.findall(r'<span[^>]*class="mt-1"[^>]*>\s*([0-9.]+)', section)
        for spec, value in zip(specs, values):
            observations[spec].append(float(value))
    return {
        canonical_spec(spec): sum(values) / len(values)
        for spec, values in observations.items()
    }


def grade_source(source: dict[str, object], actual: dict[str, float], actual_percentiles: dict[str, float]) -> tuple[float, float, float, str, int, list[str], list[dict[str, object]]]:
    role_scores = []
    details = []
    rows: list[dict[str, object]] = []
    coverage = 0
    for role, predictions in source["tiers"].items():
        predicted = midrank_percentiles(predictions, reverse=False)
        errors = [abs(predicted[spec] - actual_percentiles[spec]) for spec in predictions]
        accuracy = max(0.0, 100.0 - 2 * (sum(errors) / len(errors)))
        role_scores.append(accuracy)
        details.append(f"{role} {accuracy:.1f}")
        coverage += len(predictions)
        for spec, tier_order in predictions.items():
            rows.append({
                "spec": spec.title(),
                "role": role,
                "predicted_tier": source.get("labels", {}).get(spec, f"Tier {int(tier_order)}"),
                "predicted_tier_order": tier_order,
                "predicted_percentile": round(predicted[spec], 1),
                "actual_representation": round(actual[spec], 2),
                "actual_percentile": round(actual_percentiles[spec], 1),
                "absolute_error": round(abs(predicted[spec] - actual_percentiles[spec]), 1),
            })
    raw_score = sum(role_scores) / len(role_scores)
    coverage_multiplier = 0.85 + 0.15 * (coverage / len(ALL_SPECS))
    score = raw_score * coverage_multiplier
    tier = "S" if score >= 80 else "A" if score >= 65 else "B" if score >= 50 else "C" if score >= 35 else "D"
    return score, raw_score, coverage_multiplier, tier, coverage, details, rows


def load_actual(path: str) -> dict[str, float]:
    with Path(path).open(newline="", encoding="utf-8-sig") as handle:
        return {
            canonical_spec(row["spec"]): float(row["weeks_1_5_representation"])
            for row in csv.DictReader(handle)
        }


def main(path: str, output_dir: str | None = None, actual_path: str | None = None) -> None:
    actual = load_actual(actual_path) if actual_path else mythicstats_actual()
    actual_percentiles: dict[str, float] = {}
    for role in ("Tank", "Healer", "DPS"):
        role_actual = {
            spec: value for spec, value in actual.items() if role_for(spec) == role
        }
        actual_percentiles.update(midrank_percentiles(role_actual))

    sources: dict[str, dict[str, object]] = {}
    with Path(path).open(newline="", encoding="utf-8-sig") as handle:
        rows = csv.reader(handle)
        headers = next(rows)
        for row in rows:
            if len(row) < 13:
                continue
            source_id, creator, title, url, published, _, mode, scope, _, spec, tier, order, status = row[:13]
            if not source_id:
                continue
            spec_key = canonical_spec(spec)
            if status != "Ranked" or spec_key not in actual_percentiles:
                continue
            source = sources.setdefault(
                source_id,
                {
                    "creator": creator,
                    "title": title,
                    "url": url,
                    "published": source_date(published),
                    "mode": mode,
                    "scope": scope,
                    "source_format": "Video",
                    "tiers": collections.defaultdict(dict),
                    "labels": {},
                },
            )
            source["tiers"][role_for(spec)][spec_key] = float(order)
            source["labels"][spec_key] = str(tier)

    # The final pre-season Petko update supersedes the August 2 board.
    sources.pop("PETKO-2026-08-02", None)

    # Saltii published separate melee and ranged Mythic+ boards. Together they
    # are one complete DPS forecast, so combine them before applying coverage.
    melee = sources.pop("SALTII-2026-08-02-MELEE", None)
    ranged_ = sources.pop("SALTII-2026-08-01-RANGED", None)
    if melee and ranged_:
        combined_tiers = collections.defaultdict(dict)
        combined_labels = {}
        for source in (melee, ranged_):
            for role, predictions in source["tiers"].items():
                combined_tiers[role].update(predictions)
            combined_labels.update(source["labels"])
        sources["SALTII-2026-08-01-02-COMBINED"] = {
            "creator": "Saltii",
            "title": "12.1 META RESET! Melee + Ranged DPS UPDATED Tier Lists",
            "url": f"{melee['url']} | {ranged_['url']}",
            "published": "2026-08-02",
            "mode": "Mythic+",
            "scope": "DPS (two videos)",
            "source_format": "Video pair",
            "tiers": combined_tiers,
            "labels": combined_labels,
        }

    sources.update(MANUAL_SOURCES)

    output_path = Path(output_dir) if output_dir else None
    if output_path:
        output_path.mkdir(parents=True, exist_ok=True)

    print("creator\tsource_id\tpublished\tmode\tscope\tscore\ttier\tcoverage\trole_scores\turl")
    graded: list[dict[str, object]] = []
    for source_id, source in sources.items():
        score, raw_score, coverage_multiplier, tier, coverage, details, placement_rows = grade_source(source, actual, actual_percentiles)
        eligible = source["mode"] == "Mythic+" and coverage >= 26
        graded.append({
            "creator": source["creator"], "source_id": source_id,
            "published": source["published"], "mode": source["mode"],
            "scope": source["scope"], "score": round(score, 1), "tier": tier,
            "coverage": coverage, "role_scores": " / ".join(details),
            "raw_score": round(raw_score, 1),
            "coverage_multiplier": round(coverage_multiplier, 4),
            "eligible": eligible, "title": source["title"], "url": source["url"],
            "source_format": source.get("source_format", "Video"),
        })
        print(
            f"{source['creator']}\t{source_id}\t{source['published']}\t{source['mode']}\t{source['scope']}\t{score:.1f}\t{tier}\t{coverage}\t{' / '.join(details)}\t{source['url']}"
        )

        if output_path and eligible:
            csv_path = output_path / f"{source_id.lower()}-placements.csv"
            with csv_path.open("w", newline="", encoding="utf-8") as handle:
                writer = csv.DictWriter(handle, fieldnames=list(placement_rows[0].keys()))
                writer.writeheader()
                writer.writerows(sorted(placement_rows, key=lambda item: (item["role"], item["predicted_tier_order"], item["spec"])))

    if output_path:
        eligible_rows = sorted((row for row in graded if row["eligible"]), key=lambda row: row["score"], reverse=True)
        with (output_path / "creator-ranking.json").open("w", encoding="utf-8") as handle:
            json.dump(eligible_rows, handle, indent=2)
        with (output_path / "actual-meta.csv").open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=["spec", "role", "weeks_1_5_representation", "actual_percentile"])
            writer.writeheader()
            for spec in sorted(ALL_SPECS, key=lambda item: (role_for(item), -actual.get(item, 0), item)):
                writer.writerow({
                    "spec": spec.title(), "role": role_for(spec),
                    "weeks_1_5_representation": round(actual[spec], 2),
                    "actual_percentile": round(actual_percentiles[spec], 1),
                })


if __name__ == "__main__":
    if len(sys.argv) not in (2, 3, 4):
        raise SystemExit("Usage: analyze-midnight-s2-creator-forecasts.py SOURCE.csv [OUTPUT_DIR] [ACTUAL_META.csv]")
    main(
        sys.argv[1],
        sys.argv[2] if len(sys.argv) >= 3 else None,
        sys.argv[3] if len(sys.argv) == 4 else None,
    )
