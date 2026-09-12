"use client";
import { useEffect, useState } from "react";
import { AccountIcon } from "./account-icon";

export function AuthNotice() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    let frame: number | undefined;
    try {
      const notice = sessionStorage.getItem("certi-auth-notice");
      if (notice) frame = requestAnimationFrame(() => { setMessage(notice); try { sessionStorage.removeItem("certi-auth-notice"); } catch { /* Storage can become unavailable after mounting. */ } });
    } catch { /* Browser storage is optional. */ }
    return () => { if (frame !== undefined) cancelAnimationFrame(frame); };
  }, []);
  if (!message) return null;
  return <div className="auth-notice"><AccountIcon name="check" /><p role="status">{message}</p><button onClick={() => setMessage("")} aria-label="Dismiss account confirmation"><AccountIcon name="close" /></button></div>;
}
