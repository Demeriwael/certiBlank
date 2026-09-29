"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

// A navigation disclosure, not an application menu: links retain normal Tab behavior.
export function NavigationPopover({ label, trigger, children, className = "", hover = false }: { label: string; trigger: ReactNode; children: ReactNode; className?: string; hover?: boolean }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinned = useRef(false);
  const focusFirst = useRef(false);
  const cancelTimer = () => { if (timer.current) clearTimeout(timer.current); };
  const close = () => { cancelTimer(); pinned.current = false; setOpen(false); };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!open) return;
    if (focusFirst.current) {
      panel.current?.querySelector<HTMLElement>("a[href],button:not(:disabled)")?.focus();
      focusFirst.current = false;
    }
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        if (timer.current) clearTimeout(timer.current);
        pinned.current = false;
        setOpen(false);
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (timer.current) clearTimeout(timer.current);
      pinned.current = false;
      setOpen(false);
      // Hover must never steal keyboard focus from the rest of the page.
      if (root.current?.contains(document.activeElement)) button.current?.focus();
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);

  return <div ref={root} className={`nav-disclosure ${className}`} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  }} onPointerEnter={event => {
    cancelTimer();
    if (hover && event.pointerType === "mouse" && !open) timer.current = setTimeout(() => setOpen(true), 120);
  }} onPointerLeave={event => {
    cancelTimer();
    if (event.pointerType === "mouse" && !pinned.current && !root.current?.contains(document.activeElement)) timer.current = setTimeout(close, 220);
  }}>
    <button ref={button} type="button" className="nav-disclosure-trigger" aria-label={label} aria-expanded={open} aria-controls={id} onClick={() => {
      cancelTimer();
      if (open && pinned.current) close();
      else { pinned.current = true; setOpen(true); }
    }} onKeyDown={event => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        pinned.current = true;
        if (open) panel.current?.querySelector<HTMLElement>("a[href],button:not(:disabled)")?.focus();
        else { focusFirst.current = true; setOpen(true); }
      }
    }}>{trigger}</button>
    <div ref={panel} id={id} className="nav-popover" hidden={!open} onClick={event => {
      if (event.target instanceof Element && event.target.closest("a[href]")) close();
    }}>{children}</div>
  </div>;
}
