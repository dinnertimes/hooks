"use client";

import { useState } from "react";
import { withContext } from "../with-context";

type StepContextType = {
  step: number;
  next: () => void;
  prev: () => void;
  reset: () => void;
  goTo: (step: number) => void;
};

const { useContext, Provider } = withContext<StepContextType>();

export const useStep = useContext;

export const StepContext = ({
  children,
  min,
  max,
  initialStep = 1,
}: {
  children: React.ReactNode;
  min?: number;
  max?: number;
  initialStep?: number;
}) => {
  const [step, setStep] = useState(initialStep);
  const next = () =>
    setStep((prev) =>
      typeof max === "number" ? Math.min(prev + 1, max) : prev + 1
    );
  const prev = () =>
    setStep((prev) =>
      typeof min === "number" ? Math.max(prev - 1, min) : prev - 1
    );
  const reset = () => setStep(initialStep);
  const goTo = (step: number) =>
    setStep(() => {
      if (typeof min === "number" && step < min) {
        return min;
      }
      if (typeof max === "number" && step > max) {
        return max;
      }
      return step;
    });

  return (
    <Provider context={{ step, next, prev, reset, goTo }}>{children}</Provider>
  );
};
