"use client";
import { useEffect, useState } from "react";
import { timerLevel } from "@/lib/exam-ui";
import { ExamIcon } from "./ExamIcon";

// Only this small subtree renders every second, not the question/options/palette.
export function ExamTimer({ expiresAt, serverNow, submitted }: { expiresAt: string | null; serverNow: string; submitted: boolean }) {
  const initial = expiresAt ? Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.parse(serverNow)) / 1000)) : null;
  const [remaining, setRemaining] = useState(initial);
  useEffect(() => {
    if (!expiresAt || submitted) return;
    const deadline = performance.now() + Math.max(0, Date.parse(expiresAt) - Date.parse(serverNow));
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline - performance.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [expiresAt, serverNow, submitted]);
  const level = timerLevel(remaining);
  const time = remaining === null ? "Untimed" : `${Math.floor(remaining / 60).toString().padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;
  return <>
    <div className={`qx-timer ${level}`} role="timer" aria-live="off" aria-label={submitted ? "Session complete" : `Time remaining: ${time}`}><ExamIcon name="clock" /><div><small>{submitted ? "SESSION" : remaining === null ? "AT YOUR PACE" : "TIME REMAINING"}</small><strong>{submitted ? "Complete" : time}</strong></div></div>
    <span className="sr-only" role="status">{submitted || remaining === null ? "" : level === "critical" ? "Two minutes or less remaining. Your saved answers will be submitted when time expires." : level === "warning" ? "Ten minutes or less remaining." : ""}</span>
  </>;
}
