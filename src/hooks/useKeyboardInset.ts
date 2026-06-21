import { useEffect, useState } from 'react';

/**
 * Tracks how much of the layout viewport the on-screen keyboard is covering, so
 * bottom chrome can lift above it on mobile. Subscribes to the visualViewport
 * API (an external browser system), which is the appropriate use of an effect.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const overlap = window.innerHeight - vv.height - vv.offsetTop;
      setInset(overlap > 60 ? overlap : 0);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return inset;
}
