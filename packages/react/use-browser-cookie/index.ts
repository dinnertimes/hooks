import { useCallback, useEffect, useSyncExternalStore } from "react";
import { browserCookieStore } from "./store";

export function useBrowserCookie(name: string) {
  useEffect(() => {
    browserCookieStore.initCookieState(name);
  }, [name]);

  const value = useSyncExternalStore(
    useCallback(browserCookieStore.subscribe(name), [name]),
    useCallback(browserCookieStore.getSnapShot(name), [name]),
    useCallback(browserCookieStore.getServerSnapShot(name), [name])
  );

  const setCookie = useCallback(browserCookieStore.setCookie(name), [name]);
  const deleteCookie = useCallback(browserCookieStore.deleteCookie(name), [
    name,
  ]);

  return {
    value,
    setCookie,
    deleteCookie,
  };
}
