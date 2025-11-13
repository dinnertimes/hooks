import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
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

  // INFO: If you use react-compiler, you need to delete useMemo
  const storageStore = useMemo(
    () =>
      storage === "localStorage" ? localStorageStore : sessionStorageStore,
    [storage]
  );

  useEffect(() => {
    storageStore.initStorageState(key);
  }, [key, storageStore]);

  // INFO: If you use react-compiler, you need to delete useMemo
  const subscribe = useMemo(
    () => storageStore.subscribe(key),
    [key, storageStore]
  );
  // INFO: If you use react-compiler, you need to delete useMemo
  const getSnapshot = useMemo(
    () => storageStore.getSnapShot(key),
    [key, storageStore]
  );
  // INFO: If you use react-compiler, you need to delete useMemo
  const getServerSnapshot = useMemo(
    () => storageStore.getServerSnapShot(key),
    [key, storageStore]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // INFO: If you use react-compiler, you need to delete useMemo
  const setItem = useMemo(() => storageStore.setItem(key), [key, storageStore]);
  // INFO: If you use react-compiler, you need to delete useMemo
  const deleteItem = useMemo(
    () => storageStore.deleteItem(key),
    [key, storageStore]
  );

  return { value: transformRef.current(value), setItem, deleteItem };
}
