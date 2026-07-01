export function ConfigNeeded() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ios-bg px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ios-orange text-[28px] font-bold text-white">
        !
      </div>
      <h1 className="text-[20px] font-bold text-ios-label">
        Supabase not configured
      </h1>
      <p className="mt-2 max-w-sm text-[14px] text-ios-label-secondary">
        Copy <code className="rounded bg-ios-fill px-1 py-0.5">.env.local.example</code>{" "}
        to <code className="rounded bg-ios-fill px-1 py-0.5">.env.local</code>,
        fill in your Supabase project&apos;s URL and anon key, then restart
        the dev server. See the README for full setup steps.
      </p>
    </div>
  );
}
