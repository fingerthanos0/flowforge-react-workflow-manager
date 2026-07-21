import '@testing-library/jest-dom/vitest'

// Node's own `localStorage` global (stable since Node 22, active without a
// `--localstorage-file`) shadows jsdom's and is missing methods like
// `clear()`. Replace it with a real in-memory Storage for tests.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  clear() {
    this.store.clear()
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value))
  }
}

const memoryStorage = new MemoryStorage()

for (const target of [globalThis, window]) {
  Object.defineProperty(target, 'localStorage', {
    value: memoryStorage,
    configurable: true,
  })
}
