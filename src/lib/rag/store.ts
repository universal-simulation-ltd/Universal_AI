// Minimal IndexedDB-backed vector store. Two object stores:
//   - kbs:    knowledge-base metadata (id, name, enabled, chunk count)
//   - chunks: individual text chunks with their embedding (by kbId index)
//
// Retrieval is brute-force cosine over the chunks of the *enabled* KBs. For an
// on-device app with modest corpora this is plenty fast and avoids shipping a
// heavyweight vector index.

export interface KnowledgeBase {
  id: string
  name: string
  enabled: boolean
  chunkCount: number
  createdAt: number
}

export interface Chunk {
  id: string
  kbId: string
  text: string
  source: string
  embedding: Float32Array
}

const DB_NAME = 'universal-ai'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('kbs')) {
        db.createObjectStore('kbs', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('chunks')) {
        const s = db.createObjectStore('chunks', { keyPath: 'id' })
        s.createIndex('kbId', 'kbId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode)
        const req = fn(t.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

export async function listKBs(): Promise<KnowledgeBase[]> {
  const all = await tx<KnowledgeBase[]>('kbs', 'readonly', (s) => s.getAll())
  return all.sort((a, b) => a.createdAt - b.createdAt)
}

export async function putKB(kb: KnowledgeBase): Promise<void> {
  await tx('kbs', 'readwrite', (s) => s.put(kb))
}

export async function deleteKB(kbId: string): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(['kbs', 'chunks'], 'readwrite')
    t.objectStore('kbs').delete(kbId)
    const idx = t.objectStore('chunks').index('kbId')
    const cursorReq = idx.openCursor(IDBKeyRange.only(kbId))
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}

export async function addChunks(chunks: Chunk[]): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction('chunks', 'readwrite')
    const s = t.objectStore('chunks')
    for (const c of chunks) s.put(c)
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}

export async function getChunksFor(kbIds: string[]): Promise<Chunk[]> {
  if (kbIds.length === 0) return []
  const db = await openDB()
  return new Promise<Chunk[]>((resolve, reject) => {
    const t = db.transaction('chunks', 'readonly')
    const idx = t.objectStore('chunks').index('kbId')
    const out: Chunk[] = []
    let remaining = kbIds.length
    for (const kbId of kbIds) {
      const req = idx.getAll(IDBKeyRange.only(kbId))
      req.onsuccess = () => {
        out.push(...(req.result as Chunk[]))
        if (--remaining === 0) resolve(out)
      }
      req.onerror = () => reject(req.error)
    }
  })
}
