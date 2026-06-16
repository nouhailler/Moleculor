/* Score ring — conic-gradient arc with a white inner disc, ported from the
   prototype's ring(score, size). */

import { font, colors } from '../theme/tokens';
import { scoreColor } from '../lib/valence';

export function Ring({ score, size }: { score: number; size: number }) {
  const c = scoreColor(score);
  const th = Math.round(size * 0.11);
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${c} 0 ${score}%, ${colors.ringTrack} ${score}% 100%)`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: th,
          left: th,
          right: th,
          bottom: th,
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontFamily: font.serif, fontSize: Math.round(size * 0.4), fontWeight: 500, color: colors.ink, lineHeight: 1 }}>
          {score}
        </div>
        <div style={{ fontFamily: font.mono, fontSize: size > 80 ? 9 : 8, letterSpacing: 1, color: colors.ink3, marginTop: 2 }}>
          / 100
        </div>
      </div>
    </div>
  );
}
