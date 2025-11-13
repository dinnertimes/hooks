import { useEffect, useMemo, useSyncExternalStore } from "react";
import { browserCookieStore } from "./store";

export function useBrowserCookie(name: string) {
  useEffect(() => {
    browserCookieStore.initCookieState(name);
  }, [name]);

  // useMemo로 함수 생성을 메모이제이션
  const subscribe = useMemo(() => browserCookieStore.subscribe(name), [name]);
  const getSnapshot = useMemo(
    () => browserCookieStore.getSnapShot(name),
    [name]
  );
  const getServerSnapshot = useMemo(
    () => browserCookieStore.getServerSnapShot(name),
    [name]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // useMemo로 함수 생성을 메모이제이션
  const setCookie = useMemo(() => browserCookieStore.setCookie(name), [name]);
  const deleteCookie = useMemo(
    () => browserCookieStore.deleteCookie(name),
    [name]
  );

  return {
    value,
    setCookie,
    deleteCookie,
  };
}
