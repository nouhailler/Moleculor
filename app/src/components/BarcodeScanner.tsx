/* Full-screen camera overlay that reads a product barcode. Uses the native
   BarcodeDetector API when available (Android/Chrome, zero dependency) and
   falls back to @zxing/browser elsewhere (iOS Safari, Firefox). The camera
   stream is owned here and always torn down on unmount. Requires HTTPS — the
   app is served over HTTPS on Netlify, so that holds in production. */

import { useEffect, useRef, useState } from 'react';
import { colors, font } from '../theme/tokens';
import { CloseIcon } from './icons';

interface Props {
  onDetect: (code: string) => void;
  onClose: () => void;
}

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];

export function BarcodeScanner({ onDetect, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  // Latest onDetect, so the camera effect can run once and never re-init.
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: number | undefined;
    let zxingControls: { stop: () => void } | null = null;
    let cancelled = false;
    let fired = false;

    const finish = (code: string) => {
      if (fired || !code) return;
      fired = true;
      onDetectRef.current(code.trim());
    };

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Caméra non disponible sur ce navigateur.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: FORMATS });
          interval = window.setInterval(async () => {
            try {
              const codes = await detector.detect(video);
              if (codes && codes.length) finish(codes[0].rawValue);
            } catch {
              /* transient decode frame error — keep scanning */
            }
          }, 300);
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          const reader = new BrowserMultiFormatReader();
          zxingControls = await reader.decodeFromVideoElement(video, (result) => {
            if (result) finish(result.getText());
          });
        }
      } catch (e) {
        if (cancelled) return;
        const name = (e as any)?.name;
        setError(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'Accès caméra refusé. Autorise la caméra pour scanner.'
            : name === 'NotFoundError'
              ? 'Aucune caméra détectée sur cet appareil.'
              : 'Impossible de démarrer la caméra.',
        );
      }
    }
    start();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: '#000', display: 'flex', flexDirection: 'column' }}>
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* viewfinder frame */}
      {!error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '72%', maxWidth: 320, aspectRatio: '1.6', border: '2px solid rgba(255,255,255,.85)', borderRadius: 14, boxShadow: '0 0 0 9999px rgba(0,0,0,.35)' }} />
        </div>
      )}

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '54px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontFamily: font.sans, fontSize: 14.5, fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,.6)' }}>
          Scanner un code-barres
        </span>
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 17, border: 'none', background: 'rgba(0,0,0,.45)', cursor: 'pointer' }}
        >
          <CloseIcon color="#fff" />
        </button>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '18px 24px 34px', textAlign: 'center' }}>
        {error ? (
          <div style={{ color: '#fff', fontFamily: font.sans, fontSize: 14, lineHeight: 1.5, background: 'rgba(0,0,0,.55)', borderRadius: 14, padding: '14px 16px' }}>
            {error}
            <button
              onClick={onClose}
              style={{ display: 'block', margin: '12px auto 0', border: `1px solid ${colors.controlBorder}`, background: '#fff', borderRadius: 999, padding: '8px 18px', fontFamily: font.sans, fontSize: 13, color: colors.ink, cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <span style={{ color: 'rgba(255,255,255,.92)', fontFamily: font.sans, fontSize: 13, textShadow: '0 1px 4px rgba(0,0,0,.6)' }}>
            Centre le code-barres dans le cadre
          </span>
        )}
      </div>
    </div>
  );
}
