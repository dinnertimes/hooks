import { createContext, useContext as useReactContext } from "react";

export function withContext<T>() {
  const Context = createContext<T | null>(null);

  const useContext = () => {
    const context = useReactContext(Context);
    if (!context) {
      throw new Error("Context not found");
    }
    return context;
  };

  const Provider = ({
    children,
    context,
  }: {
    children: React.ReactNode;
    context: T;
  }) => {
    return <Context.Provider value={context}>{children}</Context.Provider>;
  };

  return { Context, useContext, Provider };
}
