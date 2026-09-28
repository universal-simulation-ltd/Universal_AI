// Structurally identical to @unisim/sdk's KnowledgeArticle (0.163.0+). Kept
// local: this app is Svelte and does not install the SDK.
export interface Article {
  id: string        // stable kebab-case slug, identical across languages
  title: string
  summary?: string  // one line shown under the title in the list
  group?: string    // list heading, e.g. "The basics" / "How it works" / "Privacy and security" (translated)
  body: string      // tiny closed markdown: paragraphs, "## ", "- ", "1. ", "**bold**"
}
