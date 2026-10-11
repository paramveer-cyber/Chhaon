import { useEffect, useState } from "react";

const defaultIntervalInMilliseconds = 2200;

export const useCyclingMessage = (messages: readonly string[], intervalInMilliseconds = defaultIntervalInMilliseconds) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(
      () => setMessageIndex((currentIndex) => (currentIndex + 1) % messages.length),
      intervalInMilliseconds,
    );
    return () => clearInterval(intervalId);
  }, [messages.length, intervalInMilliseconds]);

  return messages[messageIndex];
};
