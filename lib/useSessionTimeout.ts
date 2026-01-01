'use client';

import { useEffect, useCallback, useRef } from 'react';

interface UseSessionTimeoutOptions {
  timeoutMinutes: number;
  onTimeout: () => void;
  warningMinutes?: number;
  onWarning?: () => void;
}

export function useSessionTimeout({
  timeoutMinutes,
  onTimeout,
  warningMinutes = 5,
  onWarning,
}: UseSessionTimeoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const resetTimeout = useCallback(() => {
    clearTimers();
    lastActivityRef.current = Date.now();

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    // 警告タイマー
    if (onWarning && warningMinutes > 0 && warningMs > 0) {
      warningRef.current = setTimeout(() => {
        onWarning();
      }, warningMs);
    }

    // タイムアウトタイマー
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }, [timeoutMinutes, warningMinutes, onTimeout, onWarning, clearTimers]);

  useEffect(() => {
    // アクティビティイベント
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      // 短時間での連続リセットを防ぐ（最低1秒間隔）
      const now = Date.now();
      if (now - lastActivityRef.current > 1000) {
        resetTimeout();
      }
    };

    // イベントリスナー登録
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // 初期タイムアウト設定
    resetTimeout();

    // クリーンアップ
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [resetTimeout, clearTimers]);

  return {
    resetTimeout,
    getLastActivity: () => lastActivityRef.current,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = (timeoutMinutes * 60 * 1000) - elapsed;
      return Math.max(0, Math.floor(remaining / 1000));
    },
  };
}
