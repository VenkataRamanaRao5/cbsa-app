import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { BehavioralCollector, EmittedBehavioralPayload } from './BehavioralCollector';
import { wsService } from './WebSocketService';

// ── Trust state types ────────────────────────────────────────────────────────

export type TrustDecision = 'SAFE' | 'UNCERTAIN' | 'RISK' | 'WARMUP' | null;

export interface TrustState {
  trustScore: number | null;         // [0, 1] continuous trust score
  decision: TrustDecision;           // current zone decision
  consecutiveRisk: number;           // consecutive RISK decisions
  consecutiveUncertain: number;      // consecutive UNCERTAIN decisions
  anomalyIndicator: number | null;   // [0, 1] anomaly signal
  similarityScore: number | null;    // [0, 1] prototype similarity
  isBlocked: boolean;                // true when session must be blocked
  lastUpdated: number | null;        // Unix ms timestamp of last trust update
}

const INITIAL_TRUST_STATE: TrustState = {
  trustScore: null,
  decision: null,
  consecutiveRisk: 0,
  consecutiveUncertain: 0,
  anomalyIndicator: null,
  similarityScore: null,
  isBlocked: false,
  lastUpdated: null,
};

// Block the session after this many consecutive RISK decisions
const CONSECUTIVE_RISK_BLOCK_THRESHOLD = 3;

// Fallback guard: block if fund transfer button is pressed this many times in a row
const FUND_TRANSFER_PRESS_THRESHOLD = 4;
// Delay (ms) between the 4th press and the actual block
const FUND_TRANSFER_BLOCK_DELAY_MS = 5000;
// Delay (ms) between the 5th press and the actual block (faster escalation)
const FUND_TRANSFER_FAST_BLOCK_DELAY_MS = 2500;

// ── Context types ────────────────────────────────────────────────────────────

type BehavioralCtx = {
  collector: BehavioralCollector | null;
  isConnected: boolean;
  sessionId: string;
  trustState: TrustState;
  clearBlock: () => void;                        // called after re-authentication to reset block
  onFundTransferButtonPress: () => void;         // fallback guard: tracks fund-transfer presses
};

const Context = createContext<BehavioralCtx>({
  collector: null,
  isConnected: false,
  sessionId: '',
  trustState: INITIAL_TRUST_STATE,
  clearBlock: () => {},
  onFundTransferButtonPress: () => {},
});

// ── Provider ─────────────────────────────────────────────────────────────────

export function BehavioralProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<BehavioralCollector | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [trustState, setTrustState] = useState<TrustState>(INITIAL_TRUST_STATE);

  // Track consecutive counts across messages using a ref so the callback
  // always captures the latest value without stale closure issues.
  const consecutiveRiskRef = useRef(0);
  const consecutiveUncertainRef = useRef(0);

  // Fallback guard: track how many times the fund transfer button has been pressed
  const fundTransferPressCountRef = useRef(0);
  const fundTransferBlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fundTransferFastBlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBlock = () => {
    // Cancel any pending fallback block timers
    if (fundTransferBlockTimerRef.current !== null) {
      clearTimeout(fundTransferBlockTimerRef.current);
      fundTransferBlockTimerRef.current = null;
    }
    if (fundTransferFastBlockTimerRef.current !== null) {
      clearTimeout(fundTransferFastBlockTimerRef.current);
      fundTransferFastBlockTimerRef.current = null;
    }
    fundTransferPressCountRef.current = 0;
    consecutiveRiskRef.current = 0;
    consecutiveUncertainRef.current = 0;
    setTrustState(prev => ({
      ...prev,
      isBlocked: false,
      consecutiveRisk: 0,
      consecutiveUncertain: 0,
    }));
  };

  // Fallback guard: block the session if the fund transfer button is pressed
  // FUND_TRANSFER_PRESS_THRESHOLD times in a row without a successful transfer.
  // A 5-second warning window is given before the block is applied on press #4,
  // and a faster 2.5-second window is applied on press #5.
  const onFundTransferButtonPress = () => {
    fundTransferPressCountRef.current += 1;
    const count = fundTransferPressCountRef.current;
    console.log(`[FallbackGuard] Fund transfer press #${count}`);

    if (count === FUND_TRANSFER_PRESS_THRESHOLD && fundTransferBlockTimerRef.current === null) {
      console.log('[FallbackGuard] Threshold reached – blocking session in 5 s');
      fundTransferBlockTimerRef.current = setTimeout(() => {
        fundTransferBlockTimerRef.current = null;
        setTrustState(prev => ({ ...prev, isBlocked: true }));
      }, FUND_TRANSFER_BLOCK_DELAY_MS);
    }

    if (count === FUND_TRANSFER_PRESS_THRESHOLD + 1 && fundTransferFastBlockTimerRef.current === null) {
      console.log('[FallbackGuard] Extra press – blocking session in 2.5 s');
      // Cancel the slower timer: the fast timer supersedes it
      if (fundTransferBlockTimerRef.current !== null) {
        clearTimeout(fundTransferBlockTimerRef.current);
        fundTransferBlockTimerRef.current = null;
      }
      fundTransferFastBlockTimerRef.current = setTimeout(() => {
        fundTransferFastBlockTimerRef.current = null;
        setTrustState(prev => ({ ...prev, isBlocked: true }));
      }, FUND_TRANSFER_FAST_BLOCK_DELAY_MS);
    }
  };

  useEffect(() => {
    wsService.onConnectionChange((connected) => {
      setIsConnected(connected);
      console.log('[BehavioralProvider] WebSocket connected:', connected);
    });

    wsService.onMessage((data) => {
      // ── Handle error / simple acknowledgement ───────────────────────────
      if (data.status === 'error') {
        console.error('[BehavioralProvider] Server error:', data.message, data.errors);
        return;
      }
      if (data.status === 'received' && data.trust_score === undefined) {
        console.log('[BehavioralProvider] Server ack:', data.message_id);
        return;
      }

      setTrustState(prev => {
        if (prev.isBlocked) return { ...prev, trustScore : (prev.trustScore ?? 0.5) - 0.5 };

        // ── Parse trust result ───────────────────────────────────────────────
        const decision: TrustDecision = data.decision ?? null;
        const trustScore: number | null = data.trust_score ?? null;
        const anomaly: number | null = data.anomaly_indicator ?? null;
        const similarity: number | null = data.similarity_score ?? null;

        // Update consecutive counters
        if (decision === 'RISK') {
          consecutiveRiskRef.current += 1;
          consecutiveUncertainRef.current = 0;
        } else if (decision === 'UNCERTAIN') {
          consecutiveUncertainRef.current += 1;
          consecutiveRiskRef.current = 0;
        } else {
          consecutiveRiskRef.current = 0;
          consecutiveUncertainRef.current = 0;
        }

        const consecutiveRisk = consecutiveRiskRef.current;
        const consecutiveUncertain = consecutiveUncertainRef.current;

        // Block when RISK threshold is crossed OR trust collapses to near-zero
        const shouldBlock =
          consecutiveRisk >= CONSECUTIVE_RISK_BLOCK_THRESHOLD ||
          (trustScore !== null && trustScore < 0.20);

        console.log(
          `[Trust] decision=${decision} score=${trustScore?.toFixed(3)} ` +
          `risk_streak=${consecutiveRisk} blocked=${shouldBlock}`
        );

        return {
          trustScore,
          decision,
          consecutiveRisk,
          consecutiveUncertain,
          anomalyIndicator: anomaly,
          similarityScore: similarity,
          isBlocked: shouldBlock,
          blockTrigger: shouldBlock ? 'trust_engine' : undefined,
          lastUpdated: Date.now(),
        };
      });
    });

    wsService.connect().catch((error) => {
      console.error('[BehavioralProvider] Initial connection failed:', error);
    });

    return () => {
      wsService.disconnect();
    };
  }, []);

  // Clean up the fallback block timers when the provider unmounts to prevent
  // a state update on an already-unmounted component.
  useEffect(() => {
    return () => {
      if (fundTransferBlockTimerRef.current !== null) {
        clearTimeout(fundTransferBlockTimerRef.current);
      }
      if (fundTransferFastBlockTimerRef.current !== null) {
        clearTimeout(fundTransferFastBlockTimerRef.current);
      }
    };
  }, []);

  if (!ref.current) {
    ref.current = new BehavioralCollector((payload: EmittedBehavioralPayload) => {
      console.log('[BehavioralProvider] Sending behavioral data');

      const sent = wsService.sendBehavioralEvent(
        payload.payload.eventType || 'BEHAVIORAL_VECTOR',
        {
          timestamp: payload.payload.timestamp,
          nonce: payload.payload.nonce,
          vector: payload.payload.vector,
          deviceInfo: payload.payload.deviceInfo,
          signature: payload.signature,
        }
      );

      if (!sent) {
        console.log('[BehavioralProvider] Message queued (WebSocket not connected)');
      }
    });

    ref.current.start();
  }

  return (
    <Context.Provider value={{
      collector: ref.current,
      isConnected,
      sessionId: wsService.getSessionId(),
      trustState,
      clearBlock,
      onFundTransferButtonPress,
    }}>
      {children}
    </Context.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useBehavioralCollector() {
  return useContext(Context).collector;
}

export function useWebSocketStatus() {
  const ctx = useContext(Context);
  return {
    isConnected: ctx.isConnected,
    sessionId: ctx.sessionId,
  };
}

export function useTrustState() {
  const ctx = useContext(Context);
  return {
    trustState: ctx.trustState,
    clearBlock: ctx.clearBlock,
  };
}

export function useFundTransferBlock() {
  return useContext(Context).onFundTransferButtonPress;
}
