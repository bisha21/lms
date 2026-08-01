'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

// Animates a number from 0 up to `target` once its ref scrolls into view. Re-triggers if
// `target` changes after data finishes loading (e.g. a stat tile whose query resolves
// after the section is already on screen).
export function useCountUp(target: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) motionValue.set(target);
  }, [isInView, target, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => setDisplay(Math.round(v)));
    return unsubscribe;
  }, [spring]);

  return { ref, value: display };
}
