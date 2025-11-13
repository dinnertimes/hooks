import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { localStorageStore, sessionStorageStore } from "./store";

type UseStorageOptions<T> = {
  key: string;
  transform?: (value: string | null) => T;
};

export function useStorage<T = string | null>(
  storage: "localStorage" | "sessionStorage",
  { key, transform }: UseStorageOptions<T>
) {
  const transformRef = useRef<NonNullable<typeof transform>>(
    transform ?? ((value: string | null) => value as any)
  );
  if (transform) {
    transformRef.current = transform;
  }

  const storageStore = useMemo(
    () =>
      storage === "localStorage" ? localStorageStore : sessionStorageStore,
    [storage]
  );

  useEffect(() => {
    storageStore.initStorageState(key);
  }, [key]);

  const value = useSyncExternalStore(
    useCallback(storageStore.subscribe(key), [key]),
    useCallback(storageStore.getSnapShot(key), [key]),
    useCallback(storageStore.getServerSnapShot(key), [key])
  );

  const setItem = useCallback(storageStore.setItem(key), [key]);
  const deleteItem = useCallback(storageStore.deleteItem(key), [key]);

  return { value: transformRef.current(value), setItem, deleteItem };
}
