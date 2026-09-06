'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>Please try again.</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ cursor: 'pointer', marginTop: '1rem', padding: '0.6rem 1rem' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
