/**
 * cookieStore polyfill 코드입니다.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CookieStore
 *
 * 한계점
 * - 외부에서의 cookie 변경은 감지하지 못합니다.
 */

import { CookieInit, CookieStoreDeleteOptions } from './type';

// Cookie 객체 타입 정의
type Cookie = {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  sameSite?: CookieSameSite;
  secure?: boolean;
  partitioned?: boolean;
};

// CookieChangeEvent 타입 정의
type CookieChangeEvent = Event & {
  changed: Cookie[];
  deleted: Cookie[];
};

// document.cookie 문자열을 파싱하여 Cookie 객체로 변환
// 주의: document.cookie는 읽을 때 name=value 형식만 반환하며, attributes는 포함되지 않음
function parseCookie(cookieString: string): Cookie | null {
  const trimmed = cookieString.trim();
  if (!trimmed) return null;

  // name=value 형식 파싱
  const equalIndex = trimmed.indexOf('=');
  if (equalIndex === -1) return null;

  const name = decodeURIComponent(trimmed.substring(0, equalIndex).trim());
  const value = decodeURIComponent(trimmed.substring(equalIndex + 1).trim());

  if (!name) return null;

  return { name, value };
}

// 모든 쿠키를 파싱하여 배열로 반환
function parseAllCookies(): Cookie[] {
  if (typeof document === 'undefined' || !document.cookie) {
    return [];
  }

  const cookies: Cookie[] = [];
  // document.cookie는 세미콜론과 공백으로 구분된 쿠키 목록
  const cookieStrings = document.cookie.split(';').map((s) => s.trim());

  for (const cookieString of cookieStrings) {
    if (!cookieString) continue;
    const cookie = parseCookie(cookieString);
    if (cookie) {
      cookies.push(cookie);
    }
  }

  return cookies;
}

// CookieInit을 document.cookie 형식의 문자열로 변환
function serializeCookie(options: CookieInit): string {
  const parts: string[] = [];

  // name=value는 필수
  parts.push(`${encodeURIComponent(options.name)}=${encodeURIComponent(options.value)}`);

  // expires 처리
  if (options.expires !== null && options.expires !== undefined) {
    const expiresDate = new Date(options.expires);
    parts.push(`expires=${expiresDate.toUTCString()}`);
  }

  // max-age가 없고 expires도 없으면 세션 쿠키 (만료 시간 설정 안 함)

  // path
  if (options.path) {
    parts.push(`path=${options.path}`);
  }

  // domain
  if (options.domain) {
    parts.push(`domain=${options.domain}`);
  }

  // sameSite
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  // secure는 플래그만 설정
  // 주의: document.cookie에서 secure 속성을 읽을 수 없으므로,
  // 설정 시에만 적용되고 읽을 때는 반환되지 않음
  // CookieInit 타입에 secure가 없지만, 실제 CookieStore API에서는 지원하므로
  // 옵션에 secure가 있으면 추가 (타입 단언 사용)

  // partitioned는 쿠키 이름에 __Host- 또는 __Secure- 접두사가 필요하지만
  // document.cookie에서는 직접 지원하지 않으므로 무시

  return parts.join('; ');
}

// CookieStoreDeleteOptions를 사용하여 쿠키 삭제 문자열 생성
function serializeDeleteCookie(options: CookieStoreDeleteOptions): string {
  const parts: string[] = [];

  // 쿠키를 삭제하려면 만료 시간을 과거로 설정
  parts.push(`${encodeURIComponent(options.name)}=`);
  parts.push('expires=Thu, 01 Jan 1970 00:00:00 GMT');

  // path와 domain은 삭제 시에도 일치해야 함
  if (options.path) {
    parts.push(`path=${options.path}`);
  } else {
    parts.push('path=/');
  }

  if (options.domain) {
    parts.push(`domain=${options.domain}`);
  }

  return parts.join('; ');
}

// CookieStorePolyfill 클래스
class CookieStorePolyfill implements EventTarget {
  private changeListeners: Set<(e: CookieChangeEvent) => void> = new Set();
  private previousCookies: Map<string, Cookie> = new Map();

  constructor() {
    // 초기 쿠키 상태 저장
    this.updatePreviousCookies();
  }

  private updatePreviousCookies(): void {
    const cookies = parseAllCookies();
    this.previousCookies.clear();
    for (const cookie of cookies) {
      this.previousCookies.set(cookie.name, cookie);
    }
  }

  private checkCookieChanges(): void {
    const currentCookies = parseAllCookies();
    const currentMap = new Map<string, Cookie>();
    for (const cookie of currentCookies) {
      currentMap.set(cookie.name, cookie);
    }

    const changed: Cookie[] = [];
    const deleted: Cookie[] = [];

    // 변경된 쿠키 확인
    for (const [name, currentCookie] of currentMap.entries()) {
      const previousCookie = this.previousCookies.get(name);
      if (!previousCookie || previousCookie.value !== currentCookie.value) {
        changed.push(currentCookie);
      }
    }

    // 삭제된 쿠키 확인
    for (const [name, previousCookie] of this.previousCookies.entries()) {
      if (!currentMap.has(name)) {
        deleted.push(previousCookie);
      }
    }

    // 변경사항이 있으면 이벤트 발생
    if (changed.length > 0 || deleted.length > 0) {
      this.dispatchChangeEvent(changed, deleted);
      this.updatePreviousCookies();
    }
  }

  private dispatchChangeEvent(changed: Cookie[], deleted: Cookie[]): void {
    const event = new Event('change') as CookieChangeEvent;
    event.changed = changed;
    event.deleted = deleted;

    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in cookie change listener:', error);
      }
    }
  }

  // EventTarget 인터페이스 구현
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (type === 'change' && listener && typeof listener === 'function') {
      this.changeListeners.add(listener as (e: CookieChangeEvent) => void);
    }
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    if (type === 'change' && listener && typeof listener === 'function') {
      this.changeListeners.delete(listener as (e: CookieChangeEvent) => void);
    }
  }

  dispatchEvent(event: Event): boolean {
    if (event.type === 'change' && 'changed' in event && 'deleted' in event) {
      this.dispatchChangeEvent((event as CookieChangeEvent).changed, (event as CookieChangeEvent).deleted);
      return true;
    }
    return false;
  }

  // CookieStore 인터페이스 구현
  async get(name: string): Promise<Cookie | null> {
    if (typeof document === 'undefined') {
      return null;
    }

    const cookies = parseAllCookies();
    return cookies.find((cookie) => cookie.name === name) || null;
  }

  async getAll(name?: string): Promise<Cookie[]> {
    if (typeof document === 'undefined') {
      return [];
    }

    const cookies = parseAllCookies();
    if (name) {
      return cookies.filter((cookie) => cookie.name === name);
    }
    return cookies;
  }

  async set(options: CookieInit | string, value?: string): Promise<void> {
    if (typeof document === 'undefined') {
      return;
    }

    let cookieOptions: CookieInit;

    // 오버로드 지원: set(name, value) 또는 set(options)
    if (typeof options === 'string') {
      cookieOptions = {
        name: options,
        value: value || '',
      };
    } else {
      cookieOptions = options;
    }

    const cookieString = serializeCookie(cookieOptions);
    document.cookie = cookieString;

    // 쿠키 설정 후 즉시 변경 감지 및 이벤트 dispatch
    setTimeout(() => {
      this.checkCookieChanges();
    }, 0);
  }

  async delete(options: CookieStoreDeleteOptions | string): Promise<void> {
    if (typeof document === 'undefined') {
      return;
    }

    let deleteOptions: CookieStoreDeleteOptions;

    // 오버로드 지원: delete(name) 또는 delete(options)
    if (typeof options === 'string') {
      deleteOptions = {
        name: options,
      };
    } else {
      deleteOptions = options;
    }

    const cookieString = serializeDeleteCookie(deleteOptions);
    document.cookie = cookieString;

    // 쿠키 삭제 후 즉시 변경 감지 및 이벤트 dispatch
    setTimeout(() => {
      this.checkCookieChanges();
    }, 0);
  }
}

// 전역 cookieStore에 polyfill 적용
export function installCookieStorePolyfill(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // cookieStore가 이미 존재하면 polyfill 설치하지 않음
  if (typeof (window as any).cookieStore !== 'undefined') {
    return;
  }

  const polyfill = new CookieStorePolyfill();
  (window as any).cookieStore = polyfill;
}

// 자동 설치 (모듈 로드 시)
if (typeof window !== 'undefined') {
  installCookieStorePolyfill();
  console.log('[INFO] cookieStore polyfill is installed');
}
