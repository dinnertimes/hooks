class StorageStore {
  private readonly storageStates = new Map<string, string | null>();
  private readonly subscribers = new Map<string, Set<() => void>>();
  private readonly loadedStates = new Set<string>();

  constructor(private readonly storage: Storage) {
    if (typeof window === "undefined") {
      return;
    }

    // storage 이벤트는 같은 탭 내에서의 변경은 감지하지 못함
    // => setItem, deleteItem 메서드 호출 시에는 storage 이벤트가 발생하지 않음
    window.addEventListener("storage", (event: StorageEvent) => {
      if (!event.key) return;
      this.storageStates.set(event.key, event.newValue);
      this.emitChange(event.key);
    });
  }

  subscribe(key: string) {
    return (callback: () => void) => {
      const listeners = this.subscribers.get(key) || new Set();
      listeners.add(callback);
      this.subscribers.set(key, listeners);

      return () => {
        listeners.delete(callback); // Set에서 제거
        if (listeners.size === 0) {
          this.subscribers.delete(key);
        }
      };
    };
  }

  getSnapShot(key: string) {
    return () => {
      return this.storageStates.get(key) || null;
    };
  }

  getServerSnapShot(key: string) {
    return () => {
      return null;
    };
  }

  private emitChange(key: string) {
    const listeners = this.subscribers.get(key);
    if (listeners) {
      listeners.forEach((callback) => callback());
    }
  }

  setItem(key: string) {
    return (value: string) => {
      this.storage.setItem(key, value);
      this.storageStates.set(key, value); // 추가
      this.emitChange(key);
    };
  }

  deleteItem(key: string) {
    return () => {
      this.storage.removeItem(key);
      this.storageStates.delete(key); // 추가
      this.emitChange(key);
    };
  }

  async initStorageState(key: string) {
    if (typeof window === "undefined") {
      return;
    }
    if (this.loadedStates.has(key) || this.storageStates.has(key)) {
      return; // 이미 로딩 중이거나 로드됨
    }

    this.loadedStates.add(key);

    const value = this.storage.getItem(key);
    if (value) {
      this.storageStates.set(key, value);
      this.emitChange(key);
    }
  }
}

export const localStorageStore = new StorageStore(localStorage);
export const sessionStorageStore = new StorageStore(sessionStorage);
