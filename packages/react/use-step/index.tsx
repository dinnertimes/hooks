"use client";

import { useState } from "react";
import { withContext } from "../with-context";

type StepContextType = {
  step: number;
  next: () => void;
  prev: () => void;
  reset: () => void;
};

const { useContext, Provider } = withContext<StepContextType>();

export const useStep = useContext;

export const StepContext = ({ children }: { children: React.ReactNode }) => {
  const [step, setStep] = useState(1);
  const next = () => setStep((prev) => prev + 1);
  const prev = () => setStep((prev) => prev - 1);
  const reset = () => setStep(1);

  return <Provider context={{ step, next, prev, reset }}>{children}</Provider>;
};
