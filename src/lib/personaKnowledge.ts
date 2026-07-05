// The knowledge each character brings. Selecting a persona (personas.ts) loads
// its subject knowledge onto the device: the text below is chunked and embedded
// in-browser into a knowledge base, then retrieved from while chatting so the
// character can answer from real subject matter, with citations — not just a
// personality prompt.
//
// The corpora are bundled as raw text (Vite `?raw`) so they ship with the app
// and work fully offline: "loading" a character's knowledge is a one-time,
// on-device embed, not a server download. Keyed by persona id.

import luigiChef from './knowledge/personas/luigi-chef.md?raw'
import sherlockHolmes from './knowledge/personas/sherlock-holmes.md?raw'
import captainNemo from './knowledge/personas/captain-nemo.md?raw'
import alice from './knowledge/personas/alice.md?raw'
import mowgli from './knowledge/personas/mowgli.md?raw'
import elizabethBennet from './knowledge/personas/elizabeth-bennet.md?raw'
import merlin from './knowledge/personas/merlin.md?raw'
import phileasFogg from './knowledge/personas/phileas-fogg.md?raw'

/** Persona id → its bundled subject knowledge (raw text, embedded on selection). */
export const PERSONA_KNOWLEDGE: Record<string, string> = {
  'luigi-chef': luigiChef,
  'sherlock-holmes': sherlockHolmes,
  'captain-nemo': captainNemo,
  alice,
  mowgli,
  'elizabeth-bennet': elizabethBennet,
  merlin,
  'phileas-fogg': phileasFogg,
}

/** KB ids for persona knowledge are namespaced so they can be told apart. */
export const PERSONA_KB_PREFIX = 'persona:'

export const personaKbId = (personaId: string): string => `${PERSONA_KB_PREFIX}${personaId}`

/** Whether a persona ships subject knowledge to download and load. */
export function hasPersonaKnowledge(personaId: string | undefined | null): boolean {
  return !!personaId && personaId in PERSONA_KNOWLEDGE && !!PERSONA_KNOWLEDGE[personaId].trim()
}
