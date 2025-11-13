import { useEffect, useMemo, useSyncExternalStore } from "react";
import { browserCookieStore } from "./store";

export function useBrowserCookie(name: string) {
  useEffect(() => {
    browserCookieStore.initCookieState(name);
  }, [name]);

  // INFO: If you use react-compiler, you need to delete useMemo
  const subscribe = useMemo(() => browserCookieStore.subscribe(name), [name]);
  // INFO: If you use react-compiler, you need to delete useMemo
  const getSnapshot = useMemo(
    () => browserCookieStore.getSnapShot(name),
    [name]
  );
  // INFO: If you use react-compiler, you need to delete useMemo
  const getServerSnapshot = useMemo(
    () => browserCookieStore.getServerSnapShot(name),
    [name]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // INFO: If you use react-compiler, you need to delete useMemo
  const setCookie = useMemo(() => browserCookieStore.setCookie(name), [name]);
  // INFO: If you use react-compiler, you need to delete useMemo
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
