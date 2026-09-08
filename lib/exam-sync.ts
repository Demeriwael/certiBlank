import type { AttemptProgress, AttemptView } from "./exam-contract";

export type Draft = Pick<AttemptView, "answers" | "flagged" | "currentIndex">;
type Action = "save" | "check" | "submit";
export type SaveRequest = Draft & { action: Action; version: number; compact: true };
type Options = {
  send: (id: string, request: SaveRequest) => Promise<AttemptProgress>;
  publish: (view: AttemptView) => void;
  persist: (draft: Draft | null) => void;
  onError: (message: string) => void;
};

// One request at a time, with local changes coalesced behind it. UI reads never
// wait for the queue; server responses update metadata without rewinding input.
export class ExamSync {
  view: AttemptView;
  private dirty = false;
  private revision = 0;
  private tail: Promise<unknown> = Promise.resolve();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;
  private retryDelay = 250;
  private blocked = false;
  private critical = 0;
  private automatic: Promise<void> | undefined;

  constructor(view: AttemptView, private options: Options) { this.view = view; }

  private draft(): Draft {
    return { answers: this.view.answers, flagged: this.view.flagged, currentIndex: this.view.currentIndex };
  }

  edit(patch: Partial<Draft>) {
    if (this.disposed || this.view.isSubmitted) return;
    this.view = { ...this.view, ...patch };
    this.revision++;
    this.dirty = true;
    this.options.persist(this.draft());
    this.options.publish(this.view);
    // Start a short batching window once; continuous clicks cannot postpone it forever.
    this.schedule(250);
  }

  private schedule(delay: number) {
    if (this.timer || this.disposed || this.blocked || this.critical || !this.dirty) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.flush().catch(() => {});
    }, delay);
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task);
    this.tail = result.catch(() => {});
    return result;
  }

  private async send(action: Action, questionIndex?: number) {
    if (this.disposed || this.view.isSubmitted || (action === "save" && !this.dirty)) return;
    if (this.blocked) throw new Error("This attempt changed elsewhere. Reload to reconcile your progress.");
    const sentRevision = this.revision;
    const sent = this.draft();
    try {
      const response = await this.options.send(this.view.id, {
        ...sent, currentIndex: questionIndex ?? sent.currentIndex,
        action, version: this.view.version, compact: true,
      });
      if (this.disposed) return;
      const local = this.draft();
      const changed = this.revision !== sentRevision;
      this.view = { ...this.view, ...response };
      if (!response.isSubmitted) {
        // Check may finish after the user navigated to a different question.
        this.view = { ...this.view, ...local };
        for (const id of response.checked) {
          this.view.answers = { ...this.view.answers, [id]: response.answers[id] ?? [] };
        }
      }
      this.dirty = !response.isSubmitted && (changed || local.currentIndex !== (questionIndex ?? sent.currentIndex));
      this.retryDelay = 250;
      this.options.persist(this.dirty ? this.draft() : null);
      this.options.onError("");
      this.options.publish(this.view);
    } catch (error) {
      if (this.disposed) return;
      const status = (error as { status?: number }).status;
      this.blocked = status === 400 || status === 404 || status === 409;
      this.dirty = true;
      this.options.persist(this.draft());
      this.options.onError(this.blocked
        ? "This attempt changed or is unavailable. Reload to reconcile your saved answers."
        : "Connection interrupted. Your choices are kept on this device; syncing will retry automatically.");
      this.retryDelay = Math.min(Math.max(this.retryDelay * 2, 1000), 10000);
      throw error;
    } finally {
      this.schedule(this.retryDelay);
    }
  }

  flush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    if (this.automatic) return this.automatic;
    this.automatic = this.enqueue(() => this.send("save")).finally(() => {
      this.automatic = undefined;
      this.schedule(this.retryDelay);
    });
    return this.automatic;
  }

  // Check/submit carry the newest draft themselves; no extra flush round trip.
  async action(action: "check" | "submit", questionIndex?: number) {
    this.critical++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    try { await this.enqueue(() => this.send(action, questionIndex)); }
    finally { this.critical--; this.schedule(250); }
  }

  dispose() {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
  }
}

// Treat browser storage as untrusted input. Restore only valid selections and
// never replace an already checked answer or reopen a submitted attempt.
export function restoreDraft(view: AttemptView, raw: string | null): Draft | null {
  if (!raw || view.isSubmitted) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || !value.answers || typeof value.answers !== "object" || Array.isArray(value.answers)) return null;
    const answers = { ...view.answers };
    for (const q of view.questions) {
      const selected = value.answers[q.id];
      if (!view.checked.includes(q.id) && Array.isArray(selected) && selected.length <= q.selectionCount && new Set(selected).size === selected.length && selected.every(id => q.options.some(o => o.id === id))) answers[q.id] = selected;
    }
    return {
      answers,
      flagged: Array.isArray(value.flagged) ? [...new Set<string>(value.flagged.filter((id: unknown) => view.questions.some(q => q.id === id)))] : view.flagged,
      currentIndex: Number.isInteger(value.currentIndex) && value.currentIndex >= 0 && value.currentIndex < view.questions.length ? value.currentIndex : view.currentIndex,
    };
  } catch { return null; }
}
