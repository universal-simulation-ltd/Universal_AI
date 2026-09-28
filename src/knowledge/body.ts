// The article body is a tiny, closed markdown — the same one @unisim/sdk's
// <KnowledgeBaseDialog> reads (parseArticleBody, 0.163.0): blank-line
// paragraphs, `## ` subheadings, `- ` bullets, `1. ` steps and `**bold**`.
// Nothing else is interpreted, and the reader renders the blocks as elements,
// never as HTML, so nothing an article says can inject markup.

export type Block =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }

/** Splits an article body into blocks. A port of the SDK's parseArticleBody. */
export function parseArticleBody(body: string): Block[] {
  const blocks: Block[] = []
  const lines = body.replace(/\r\n?/g, '\n').split('\n')
  let para: string[] = []
  const flush = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join(' ') })
    para = []
  }
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { flush(); continue }
    const h = /^#{2,3}\s+(.*)$/.exec(line)
    const ul = /^[-•*]\s+(.*)$/.exec(line)
    const ol = /^\d+[.)]\s+(.*)$/.exec(line)
    if (h) { flush(); blocks.push({ kind: 'h', text: h[1] ?? '' }); continue }
    if (ul || ol) {
      flush()
      const kind = ul ? 'ul' : 'ol'
      const text = (ul ?? ol)![1] ?? ''
      const last = blocks[blocks.length - 1]
      if (last && last.kind === kind) last.items.push(text)
      else blocks.push({ kind, items: [text] })
      continue
    }
    // A wrapped line directly under a bullet continues that bullet.
    const last = blocks[blocks.length - 1]
    if (!para.length && last && (last.kind === 'ul' || last.kind === 'ol') && /^\s/.test(raw)) {
      last.items[last.items.length - 1] = `${last.items[last.items.length - 1] ?? ''} ${line}`
      continue
    }
    para.push(line)
  }
  flush()
  return blocks
}

/** `**bold**` runs and plain text, in order. Everything else stays literal. */
export function inlineRuns(text: string): { bold: boolean; text: string }[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part !== '')
    .map((part) =>
      /^\*\*[^*]+\*\*$/.test(part)
        ? { bold: true, text: part.slice(2, -2) }
        : { bold: false, text: part },
    )
}
