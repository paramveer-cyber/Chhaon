"use client";

import { useAnimatedNumber } from "~/hooks/animated-number";

type AnimatedNumberProps = { value: number; format: (value: number) => string };

export const AnimatedNumber = ({ value, format }: AnimatedNumberProps) => <>{format(useAnimatedNumber(value))}</>;
