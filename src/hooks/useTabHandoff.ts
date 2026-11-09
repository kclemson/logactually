import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setDraft } from '@/lib/log-drafts';

interface HandoffState {
  handoffText?: string;
}

/**
 * Moves unrecognized text between the Food and Exercise tabs.
 * - sendTo: put the text in the target box's draft and navigate there (same date).
 * - On arrival, the target page consumes the text once (history state is replaced
 *   so refresh/back never resubmits) and runs its normal submit.
 */
export function useTabHandoff(onReceive: (text: string) => void) {
  const location = useLocation();
  const navigate = useNavigate();
  const consumedRef = useRef(false);

  const incoming = (location.state as HandoffState | null)?.handoffText;

  useEffect(() => {
    if (!incoming || consumedRef.current) return;
    consumedRef.current = true;
    navigate(location.pathname + location.search, { replace: true, state: null });
    onReceive(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming]);

  const sendTo = (target: 'food' | 'weights', text: string, date: string) => {
    setDraft(target, text);
    const path = target === 'food' ? '/' : '/weights';
    navigate(`${path}?date=${date}`, { state: { handoffText: text } });
  };

  return { sendTo };
}
