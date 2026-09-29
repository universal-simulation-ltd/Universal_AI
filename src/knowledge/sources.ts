import type { Source } from './types'

// The research, standards and reports behind each article, keyed by article
// id. The same in every language, so kept once here and attached by index.ts.
//
// Original research papers first, then the standards, then guidance — and
// only sources for what the app really does (checked against src/ on
// 2026-09-29: @mlc-ai/web-llm on WebGPU with q4f16_1 MLC builds of Qwen2.5
// 0.5B and Llama 3.2 1B/3B; @wllama/wllama (llama.cpp compiled to
// WebAssembly) with Q4_K_M GGUF files in CPU mode; @huggingface/transformers
// running Xenova/all-MiniLM-L6-v2 (q8, mean-pooled, normalised) for
// retrieval; brute-force cosine top-k over ~700-character chunks in
// IndexedDB and an int8 Simple Wikipedia pack in the Cache API; numbered [n]
// citations in the prompt; chats and settings in localStorage; web search
// via the English Wikipedia REST API). Safe mode and characters are system
// prompts only — no classifier or output filter — so no moderation-model
// papers are cited.
//
// ⚠️ `pdf` (our hosted copy at opensource.unisim.co.uk/kb/papers/) ONLY where
// the licence allows redistribution: US Government works, CC BY / CC BY-SA
// (the arXiv or ACL Anthology copy itself carries the licence). Papers under
// arXiv's non-exclusive licence (Transformer, Llama 3, Qwen2.5, RAG, MiniLM,
// InstructGPT, Jailbroken) and ACM papers link to the free copy instead. The
// Nature and ACM Computing Surveys papers are hosted from their CC BY arXiv
// versions.

const STORAGE_STANDARD: Source = {
  kind: 'standard',
  title: 'Storage Standard',
  publisher: 'WHATWG',
  href: 'https://storage.spec.whatwg.org/',
}

export const SOURCES: Record<string, Source[]> = {
  'what-is-a-language-model': [
    {
      kind: 'paper',
      title: 'Attention Is All You Need',
      authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin',
      publisher: 'NeurIPS',
      year: 2017,
      href: 'https://arxiv.org/abs/1706.03762',
    },
    {
      kind: 'paper',
      title: 'The Llama 3 Herd of Models',
      authors: 'Llama Team, AI @ Meta',
      publisher: 'arXiv',
      year: 2024,
      href: 'https://arxiv.org/abs/2407.21783',
    },
    {
      kind: 'report',
      title: 'Qwen2.5 Technical Report',
      authors: 'Qwen Team (An Yang, Baosong Yang, Beichen Zhang et al.)',
      publisher: 'arXiv',
      year: 2024,
      href: 'https://arxiv.org/abs/2412.15115',
    },
    {
      kind: 'paper',
      title: 'Survey of Hallucination in Natural Language Generation',
      authors: 'Ziwei Ji, Nayeon Lee, Rita Frieske, Tiezheng Yu, Dan Su, Yan Xu, Etsuko Ishii, Yejin Bang, Andrea Madotto, Pascale Fung',
      publisher: 'ACM Computing Surveys',
      year: 2023,
      href: 'https://arxiv.org/abs/2202.03629',
      pdf: 'papers/hallucination-survey-2023.pdf',
      licence: 'CC BY 4.0 — Ji et al. (arXiv version)',
    },
  ],
  'running-on-your-device': [
    {
      kind: 'paper',
      title: 'WebLLM: A High-Performance In-Browser LLM Inference Engine',
      authors: 'Charlie F. Ruan, Yucheng Qin, Akaash R. Parthasarathy, Xun Zhou, Ruihang Lai, Hongyi Jin, Yixin Dong, Bohan Hou, Meng-Shiun Yu, Yiyan Zhai, Sudeep Agarwal, Hangrui Cao, Siyuan Feng, Tianqi Chen',
      publisher: 'arXiv',
      year: 2024,
      href: 'https://arxiv.org/abs/2412.15803',
      pdf: 'papers/webllm-2024.pdf',
      licence: 'CC BY-SA 4.0 — Ruan et al.',
    },
    {
      kind: 'standard',
      title: 'WebGPU',
      publisher: 'W3C',
      href: 'https://www.w3.org/TR/webgpu/',
    },
    {
      kind: 'paper',
      title: 'Bringing the Web up to Speed with WebAssembly',
      authors: 'Andreas Haas, Andreas Rossberg, Derek L. Schuff, Ben L. Titzer, Michael Holman, Dan Gohman, Luke Wagner, Alon Zakai, JF Bastien',
      publisher: 'ACM PLDI',
      year: 2017,
      href: 'https://people.mpi-sws.org/~rossberg/papers/Haas,%20Rossberg,%20Schuff,%20Titzer,%20Gohman,%20Wagner,%20Zakai,%20Bastien,%20Holman%20-%20Bringing%20the%20Web%20up%20to%20Speed%20with%20WebAssembly.pdf',
    },
    {
      kind: 'guidance',
      title: 'wllama — WebAssembly binding for llama.cpp, the engine this app uses in CPU mode',
      href: 'https://github.com/ngxson/wllama',
    },
  ],
  'models-download-and-storage': [
    {
      kind: 'standard',
      title: 'GGUF — the model file format used in CPU mode (incl. the Q4_K 4-bit types)',
      publisher: 'ggml project',
      href: 'https://github.com/ggml-org/ggml/blob/master/docs/gguf.md',
    },
    {
      kind: 'guidance',
      title: 'all-MiniLM-L6-v2 — model card for the small search model',
      publisher: 'Sentence Transformers, Hugging Face',
      href: 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2',
    },
    STORAGE_STANDARD,
  ],
  'documents-and-sources': [
    {
      kind: 'paper',
      title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
      authors: 'Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, Sebastian Riedel, Douwe Kiela',
      publisher: 'NeurIPS',
      year: 2020,
      href: 'https://arxiv.org/abs/2005.11401',
    },
    {
      kind: 'paper',
      title: 'Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks',
      authors: 'Nils Reimers, Iryna Gurevych',
      publisher: 'EMNLP-IJCNLP',
      year: 2019,
      href: 'https://aclanthology.org/D19-1410/',
      pdf: 'papers/sentence-bert-2019.pdf',
      licence: 'CC BY 4.0 — ACL Anthology',
    },
    {
      kind: 'paper',
      title: 'MiniLM: Deep Self-Attention Distillation for Task-Agnostic Compression of Pre-Trained Transformers',
      authors: 'Wenhui Wang, Furu Wei, Li Dong, Hangbo Bao, Nan Yang, Ming Zhou',
      publisher: 'NeurIPS',
      year: 2020,
      href: 'https://arxiv.org/abs/2002.10957',
    },
    {
      kind: 'paper',
      title: 'Enabling Large Language Models to Generate Text with Citations',
      authors: 'Tianyu Gao, Howard Yen, Jiatong Yu, Danqi Chen',
      publisher: 'EMNLP',
      year: 2023,
      href: 'https://aclanthology.org/2023.emnlp-main.398/',
      pdf: 'papers/alce-llm-citations-2023.pdf',
      licence: 'CC BY 4.0 — ACL Anthology',
    },
  ],
  'characters-and-safe-mode': [
    {
      kind: 'paper',
      title: 'Training language models to follow instructions with human feedback',
      authors: 'Long Ouyang, Jeff Wu, Xu Jiang, Diogo Almeida, Carroll L. Wainwright, Pamela Mishkin et al.',
      publisher: 'NeurIPS',
      year: 2022,
      href: 'https://arxiv.org/abs/2203.02155',
    },
    {
      kind: 'paper',
      title: 'Role play with large language models',
      authors: 'Murray Shanahan, Kyle McDonell, Laria Reynolds',
      publisher: 'Nature',
      year: 2023,
      href: 'https://arxiv.org/abs/2305.16367',
      pdf: 'papers/role-play-llms-2023.pdf',
      licence: 'CC BY 4.0 — Shanahan, McDonell, Reynolds (arXiv version)',
    },
    {
      kind: 'paper',
      title: 'Jailbroken: How Does LLM Safety Training Fail?',
      authors: 'Alexander Wei, Nika Haghtalab, Jacob Steinhardt',
      publisher: 'NeurIPS',
      year: 2023,
      href: 'https://arxiv.org/abs/2307.02483',
    },
    {
      kind: 'guidance',
      title: 'NIST AI 600-1: Artificial Intelligence Risk Management Framework — Generative Artificial Intelligence Profile',
      publisher: 'NIST',
      year: 2024,
      href: 'https://doi.org/10.6028/NIST.AI.600-1',
      pdf: 'papers/nist-ai-600-1-generative-ai-profile.pdf',
      licence: 'Public domain (US Government work)',
    },
  ],
  'what-leaves-your-device': [
    {
      kind: 'paper',
      title: 'Local-first software: You own your data, in spite of the cloud',
      authors: 'Martin Kleppmann, Adam Wiggins, Peter van Hardenberg, Mark McGranaghan',
      publisher: 'ACM Onward!',
      year: 2019,
      href: 'https://www.inkandswitch.com/local-first/static/local-first.pdf',
    },
    {
      kind: 'guidance',
      title: 'MediaWiki REST API reference — the Wikipedia page search used by web search',
      publisher: 'Wikimedia Foundation',
      href: 'https://www.mediawiki.org/wiki/API:REST_API/Reference',
    },
    {
      kind: 'guidance',
      title: 'Wikimedia Foundation Privacy Policy',
      publisher: 'Wikimedia Foundation',
      href: 'https://foundation.wikimedia.org/wiki/Policy:Privacy_policy',
    },
  ],
  'what-is-stored': [
    STORAGE_STANDARD,
    {
      kind: 'standard',
      title: 'HTML Standard, §12: Web storage (localStorage)',
      publisher: 'WHATWG',
      href: 'https://html.spec.whatwg.org/multipage/webstorage.html',
    },
    {
      kind: 'standard',
      title: 'Indexed Database API 3.0',
      publisher: 'W3C',
      href: 'https://www.w3.org/TR/IndexedDB/',
    },
    {
      kind: 'standard',
      title: 'The Web Origin Concept (RFC 6454)',
      authors: 'Adam Barth',
      publisher: 'IETF',
      year: 2011,
      href: 'https://www.rfc-editor.org/rfc/rfc6454.html',
    },
  ],
}
