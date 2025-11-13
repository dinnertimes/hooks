import { useEffect, useRef } from "react";

type IntersectionObserverCallbacks = {
  onIntersect: (entry: IntersectionObserverEntry) => void;
  once?: boolean;
};

type UseIntersectionObserverOptions = IntersectionObserverInit &
  IntersectionObserverCallbacks;

export function useIntersectionObserver<T extends HTMLElement>(
  options: UseIntersectionObserverOptions
) {
  const ref = useRef<T | null>(null);

  // 콜백만 ref로 관리
  const callbacksRef = useRef<IntersectionObserverCallbacks>({
    onIntersect: options.onIntersect,
    once: options.once,
  });
  // 매 렌더링마다 최신 콜백으로 업데이트
  callbacksRef.current = {
    onIntersect: options.onIntersect,
    once: options.once,
  };

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callbacksRef.current.onIntersect(entry);
          if (callbacksRef.current.once) {
            observer.disconnect();
          }
        }
      },
      {
        root: options.root,
        rootMargin: options.rootMargin,
        threshold: options.threshold,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [options.root, options.rootMargin, options.threshold]);

  return {
    ref,
  };
}
