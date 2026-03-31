'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Global Error]', error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0f172a', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', textAlign: 'center', padding: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>!</div>
          <h1 style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 900, margin: '0 0 0.5rem' }}>
            App crashed
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 2rem' }}>
            A critical error occurred. Please try refreshing.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '1rem', padding: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </body>
    </html>
  );
}
