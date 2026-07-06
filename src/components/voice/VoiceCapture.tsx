"use client";

import { useEffect, useMemo, useState } from "react";
import { Mic, Square, Keyboard } from "lucide-react";
import { useSpeechRecognition } from "@/lib/voice/useSpeechRecognition";
import { parseVoiceInput, type ParseContext } from "@/lib/voice/parse";

/**
 * Capture screen: hold-to-talk mic with a live, editable transcript. Falls
 * back to plain typing when the browser has no Web Speech API. Emits the
 * final text upward for parsing when the user is ready to review.
 */
export function VoiceCapture({
  ctx,
  onSubmit,
}: {
  ctx: ParseContext;
  onSubmit: (text: string) => void;
}) {
  const speech = useSpeechRecognition();
  const [text, setText] = useState("");

  // Mirror finalised speech into the editable field.
  useEffect(() => {
    if (speech.transcript) setText(speech.transcript);
  }, [speech.transcript]);

  const liveText = useMemo(
    () => [text, speech.interim].filter(Boolean).join(" ").trim(),
    [text, speech.interim]
  );

  const detectedCount = useMemo(
    () => parseVoiceInput(liveText, ctx).length,
    [liveText, ctx]
  );

  function toggleMic() {
    if (speech.listening) speech.stop();
    else speech.start();
  }

  function handleReview() {
    if (speech.listening) speech.stop();
    if (liveText.trim()) onSubmit(liveText.trim());
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {speech.supported ? (
        <>
          <button
            onClick={toggleMic}
            aria-label={speech.listening ? "Stop listening" : "Start speaking"}
            className={
              "relative flex h-28 w-28 items-center justify-center rounded-full text-white shadow-xl transition-transform active:scale-95 " +
              (speech.listening ? "bg-ios-red" : "bg-ios-blue")
            }
          >
            {speech.listening && (
              <span className="absolute inset-0 animate-ping rounded-full bg-ios-red/40" />
            )}
            {speech.listening ? <Square size={40} /> : <Mic size={44} />}
          </button>
          <p className="text-[14px] font-medium text-ios-label-secondary">
            {speech.listening
              ? "Listening… tap to stop"
              : text
                ? "Tap to add more"
                : "Tap and speak your transactions"}
          </p>
        </>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-ios-fill px-3 py-2 text-[13px] text-ios-label-secondary">
          <Keyboard size={15} />
          Voice input isn&apos;t available here — type below instead.
        </div>
      )}

      {speech.error && (
        <p className="text-center text-[13px] text-ios-red">{speech.error}</p>
      )}

      <div className="w-full">
        <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
          Transcript
        </label>
        <textarea
          value={liveText}
          onChange={(e) => {
            speech.setTranscript(e.target.value);
            setText(e.target.value);
          }}
          rows={4}
          placeholder={'e.g. "Kiki spent 47 on Zomato yesterday and Taxi 30 today"'}
          className="w-full resize-none rounded-xl border border-ios-separator bg-ios-bg px-4 py-3 text-[16px] text-ios-label outline-none focus:border-ios-blue"
        />
        <p className="mt-1 text-[12px] text-ios-label-tertiary">
          Say several in a row — separate with &ldquo;and&rdquo; or &ldquo;then&rdquo;.
        </p>
      </div>

      <button
        onClick={handleReview}
        disabled={detectedCount === 0}
        className="w-full rounded-xl bg-ios-blue px-4 py-3 text-[16px] font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-40"
      >
        {detectedCount === 0
          ? "Review"
          : `Review ${detectedCount} transaction${detectedCount === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
