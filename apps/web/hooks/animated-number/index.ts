import { useEffect, useState } from "react";

const defaultDurationInMilliseconds = 900;

export const useAnimatedNumber = (targetValue: number, durationInMilliseconds = defaultDurationInMilliseconds) => {
  const [displayedValue, setDisplayedValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayedValue(targetValue);
      return;
    }
    const startTime = performance.now();
    let frameId = 0;
    const showNextFrame = (currentTime: number) => {
      const progress = Math.min(1, (currentTime - startTime) / durationInMilliseconds);
      const easedProgress = 1 - (1 - progress) ** 3;
      setDisplayedValue(targetValue * easedProgress);
      if (progress < 1) frameId = requestAnimationFrame(showNextFrame);
    };
    frameId = requestAnimationFrame(showNextFrame);
    return () => cancelAnimationFrame(frameId);
  }, [targetValue, durationInMilliseconds]);

  return displayedValue;
};
