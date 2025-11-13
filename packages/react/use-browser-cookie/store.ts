import { fallbackMessage } from "./constant";
import { CookieInit, CookieStoreDeleteOptions } from "./type";
import "./polyfill"; // polyfill 자동 설치

class BrowserCookieStore {
  private readonly cookieStates = new Map<string, string | null>();
  private readonly subscribers = new Map<string, Set<() => void>>();
  private readonly loadedStates = new Set<string>();

  constructor() {
    if (typeof window === "undefined") {
      return;
    }

    // polyfill이 설치되었는지 확인
    if (typeof cookieStore === "undefined") {
      console.warn(fallbackMessage);
      return;
    }

    cookieStore.addEventListener("change", (e: CookieChangeEvent) => {
      e.changed.forEach((changed) => {
        if (!changed.name) return;
        this.cookieStates.set(changed.name, changed.value || null);
        this.emitChange(changed.name);
      });
      e.deleted.forEach((deleted) => {
        if (!deleted.name) return;
        this.cookieStates.delete(deleted.name);
        this.emitChange(deleted.name);
      });
    });
  }

  subscribe(name: string) {
    return (callback: () => void) => {
      const listeners = this.subscribers.get(name) || new Set();
      listeners.add(callback);
      this.subscribers.set(name, listeners);

      return () => {
        listeners.delete(callback); // Set에서 제거
        if (listeners.size === 0) {
          this.subscribers.delete(name);
        }
      };
    };
  }

  getSnapShot(name: string) {
    return () => {
      return this.cookieStates.get(name) || null;
    };
  }

  getServerSnapShot(name: string) {
    return () => {
      return null;
    };
  }

  private emitChange(name: string) {
    const listeners = this.subscribers.get(name);
    if (listeners) {
      listeners.forEach((callback) => callback());
    }
  }

  setCookie(name: string) {
    return async (options: Omit<CookieInit, "name">) => {
      if (typeof window === "undefined" || typeof cookieStore === "undefined") {
        return;
      }
      await cookieStore.set({ name, ...options });
    };
  }

  deleteCookie(name: string) {
    return async (options?: Omit<CookieStoreDeleteOptions, "name">) => {
      if (typeof window === "undefined" || typeof cookieStore === "undefined") {
        return;
      }
      await cookieStore.delete({ name, ...options });
    };
  }

  async initCookieState(name: string) {
    if (typeof window === "undefined" || typeof cookieStore === "undefined") {
      return;
    }
    if (this.loadedStates.has(name) || this.cookieStates.has(name)) {
      return; // 이미 로딩 중이거나 로드됨
    }

    this.loadedStates.add(name);

    return cookieStore.get(name).then((cookie) => {
      if (!cookie) return;
      this.cookieStates.set(name, cookie.value || null);
      this.emitChange(name);
    });
  }
}

export const browserCookieStore = new BrowserCookieStore();
