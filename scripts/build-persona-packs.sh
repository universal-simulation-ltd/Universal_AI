#!/usr/bin/env bash
# Build every character's knowledge pack from its curated JSONL corpus.
#
# Each persona (see PERSONAS in src/lib/personas.ts) has a downloadable,
# pre-embedded RAG pack. The source corpora live in scripts/data/personas/<id>.jsonl
# (one {"title","text"} object per line); this script embeds each into the
# public/knowledge/persona-<slug>.v<ver>.{bin,json} pack the app downloads.
#
# Pack ids + filenames must match BUILTIN_PACKS in src/lib/rag/pack.ts.
#
# Usage:
#   scripts/build-persona-packs.sh            # build all that have a corpus
#   scripts/build-persona-packs.sh luigi-chef # build just one
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$ROOT/scripts/data/personas"
VERSION="${VERSION:-1}"

# persona-id | pack-id | out-slug | display name | count-unit | card description
PACKS=(
  "luigi-chef|builtin:kb-luigi|persona-luigi|Cooking & recipes|entries|Recipes, techniques, ingredients & world cuisines"
  "sherlock-holmes|builtin:kb-sherlock|persona-sherlock|Logic & deduction|entries|Reasoning, fallacies, forensics & problem-solving"
  "captain-nemo|builtin:kb-nemo|persona-nemo|Science & the sea|entries|Oceans, marine life, ships & natural science"
  "alice|builtin:kb-alice|persona-alice|Stories & writing|entries|Story craft, literary devices, genres & poetry"
  "mowgli|builtin:kb-mowgli|persona-mowgli|Wilderness & the outdoors|entries|Survival, first aid, plants, animals & the outdoors"
  "elizabeth-bennet|builtin:kb-elizabeth|persona-elizabeth|Manners & relationships|entries|Etiquette, conversation, relationships & emotional intelligence"
  "merlin|builtin:kb-merlin|persona-merlin|Wisdom & advice|entries|Proverbs, philosophy, mental models & life advice"
  "phileas-fogg|builtin:kb-fogg|persona-fogg|Travel & geography|entries|Countries, capitals, landmarks & world cultures"
)

ONLY="${1:-}"

for row in "${PACKS[@]}"; do
  IFS='|' read -r pid packid out name unit desc <<< "$row"
  [ -n "$ONLY" ] && [ "$ONLY" != "$pid" ] && continue
  src="$DATA/$pid.jsonl"
  if [ ! -f "$src" ]; then
    echo "SKIP $pid — no corpus at $src"
    continue
  fi
  echo "=== Building $pid ($packid) ==="
  node "$ROOT/scripts/build-knowledge-pack.mjs" \
    --source=jsonl --input="$src" \
    --id="$packid" --out="$out" \
    --name="$name" --unit="$unit" --desc="$desc" \
    --limit=5000 --version="$VERSION"
done

echo "Done. Packs written to $ROOT/public/knowledge/"
