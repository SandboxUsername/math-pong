"use client";

import { useEffect, useRef } from "react";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function requestLock() {
      const nav = navigator as WakeLockNavigator;
      if (!active || !nav.wakeLock) return;

      try {
        const lock = await nav.wakeLock.request("screen");
        if (cancelled) {
          await lock.release();
          return;
        }
        lockRef.current = lock;
      } catch {
        lockRef.current = null;
      }
    }

    requestLock();

    return () => {
      cancelled = true;
      const lock = lockRef.current;
      lockRef.current = null;
      void lock?.release();
    };
  }, [active]);
}
