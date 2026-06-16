/* Floating "IA" badge shown while a food is generated in the background, so the
   user can keep navigating. Shows a spinning hourglass + a live seconds counter
   while running, then a tappable success state (opens the new food) or an error
   state. Auto-dismisses after completion. */

import { useEffect, useState } from 'react';
import { colors, font, radius, shadow } from '../theme/tokens';
import { HourglassIcon, CheckIcon, CloseIcon } from './icons';

export interface GenJob {
  id: number;
  query: string;
  startedAt: number;
  finishedAt?: number;
  status: 'running' | 'done' | 'error';
  foodId?: string;
  foodName?: string;
  error?: string;
}

interface Props {
  job: GenJob;
  onOpen: (id: string) => void;
  onDismiss: () => void;
}

export function GenerationBadge({ job, onOpen, onDismiss }: Props) {
  const running = job.status === 'running';

  // Live elapsed seconds while running; frozen total once finished.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [running]);

  // Auto-dismiss the terminal states after a few seconds.
  useEffect(() => {
    if (running) return;
    const t = setTimeout(onDismiss, 7000);
    return () => clearTimeout(t);
  }, [running, job.id, onDismiss]);

  const elapsedMs = (running ? now : job.finishedAt ?? now) - job.startedAt;
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));

  const clickable = job.status === 'done' && job.foodId;
  const onClick = () => {
    if (job.status === 'done' && job.foodId) onOpen(job.foodId);
    else if (job.status === 'error') onDismiss();
  };

  const border =
    job.status === 'error' ? colors.watch : job.status === 'done' ? colors.benefic : colors.controlBorder;

  return (
    <div
      onClick={onClick}
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 96,
        transform: 'translateX(-50%)',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        maxWidth: 320,
        background: colors.surface,
        border: `1px solid ${border}`,
        borderRadius: radius.pill,
        padding: '9px 14px',
        boxShadow: shadow.card,
        cursor: clickable || job.status === 'error' ? 'pointer' : 'default',
        animation: 'molOv .25s ease both',
      }}
    >
      {/* "IA" chip */}
      <span
        style={{
          fontFamily: font.mono,
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: 1,
          color: '#fff',
          background: job.status === 'error' ? colors.watch : colors.benefic,
          borderRadius: 6,
          padding: '2px 5px',
          flexShrink: 0,
        }}
      >
        IA
      </span>

      {running && (
        <span style={{ display: 'flex', animation: 'molSpin 1.2s linear infinite' }}>
          <HourglassIcon />
        </span>
      )}
      {job.status === 'done' && <CheckIcon />}

      <span style={{ fontSize: 13, color: colors.ink, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {running && (
          <>
            Génération de « {job.query} »… <span style={{ fontFamily: font.mono, color: colors.ink2 }}>{seconds}s</span>
          </>
        )}
        {job.status === 'done' && (
          <>
            {job.foodName} ajouté <span style={{ fontFamily: font.mono, color: colors.ink3 }}>· {seconds}s</span>
          </>
        )}
        {job.status === 'error' && <span style={{ color: colors.watch }}>{job.error}</span>}
      </span>

      {!running && (
        <span
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          aria-label="Fermer"
          style={{ display: 'flex', flexShrink: 0, cursor: 'pointer', padding: 2 }}
        >
          <CloseIcon />
        </span>
      )}
    </div>
  );
}
