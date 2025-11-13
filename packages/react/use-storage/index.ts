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

  const storageStore = useMemo(
    () =>
      storage === "localStorage" ? localStorageStore : sessionStorageStore,
    [storage]
  );

  useEffect(() => {
    storageStore.initStorageState(key);
  }, [key]);

  // useMemo로 함수 생성을 메모이제이션
  const subscribe = useMemo(
    () => storageStore.subscribe(key),
    [key, storageStore]
  );
  const getSnapshot = useMemo(
    () => storageStore.getSnapShot(key),
    [key, storageStore]
  );
  const getServerSnapshot = useMemo(
    () => storageStore.getServerSnapShot(key),
    [key, storageStore]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // useMemo로 함수 생성을 메모이제이션
  const setItem = useMemo(() => storageStore.setItem(key), [key, storageStore]);
  const deleteItem = useMemo(
    () => storageStore.deleteItem(key),
    [key, storageStore]
  );

  return { value: transformRef.current(value), setItem, deleteItem };
}
