"use client"; // Error boundaries must be Client Components

// Replaces the root layout when it crashes, so it must render its own
// <html>/<body> and can't rely on globals.css — styles are inline.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F2F2F7",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 340 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#000" }}>
            Kunty hit a snag
          </h2>
          <p style={{ fontSize: 14, color: "#6e6e73", marginTop: 4 }}>
            An unexpected error stopped the app from loading. Your data is
            safe.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: "#aeaeb2", marginTop: 4 }}>
              Ref: {error.digest}
            </p>
          )}
          <button
            onClick={() => unstable_retry()}
            style={{
              marginTop: 16,
              background: "#007AFF",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 20px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
