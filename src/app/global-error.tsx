'use client';

// This file is intentionally left blank to allow the default Next.js error overlay to be displayed.
// This aids in debugging during development.
// You can re-implement this file with custom error UI for production.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
