/* Shared bottom-sheet shell: scrim (fade ~220ms) + panel (slide-up ~320ms). */

import type { ReactNode } from 'react';
import { colors, radius, shadow } from '../theme/tokens';

export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: colors.modalScrim,
          zIndex: 30,
          animation: 'molOv .22s ease both',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 31,
          background: colors.appBg,
          borderRadius: `${radius.sheet}px ${radius.sheet}px 0 0`,
          maxHeight: '86%',
          overflowY: 'auto',
          boxShadow: shadow.sheet,
          animation: 'molSheet .32s cubic-bezier(.22,1,.36,1) both',
        }}
      >
        <div style={{ height: 6 }} />
        <div style={{ width: 38, height: 5, borderRadius: radius.pill, background: '#d8d1c2', margin: '8px auto 0' }} />
        {children}
      </div>
    </>
  );
}
