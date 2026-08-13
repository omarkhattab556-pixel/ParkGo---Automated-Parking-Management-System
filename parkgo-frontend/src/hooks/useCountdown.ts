import { useEffect, useState } from 'react';

/**
 * Counts down to zero from `seconds`, re-starting whenever `seconds` changes.
 * Returns the remaining whole seconds. Pass 0 (or a falsy value) to idle.
 *
 * Drives the login lockout timer, so it tracks wall-clock time rather than
 * counting ticks — a backgrounded tab throttles timers, and we don't want the
 * displayed countdown to drift behind the server's actual unlock time.
 */
export const useCountdown = (seconds: number) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!seconds || seconds <= 0) {
      setRemaining(0);
      return;
    }

    const endsAt = Date.now() + seconds * 1000; // מחשב את הזמן שבו הספירה תסתיים
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))); 

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  return remaining;
};

/** Format a second count as `m:ss`, or `0:ss` under a minute. */
export const formatCountdown = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export default useCountdown;
