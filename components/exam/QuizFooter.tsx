import { ExamIcon } from "./ExamIcon";

export function QuizFooter({ index, total, flagged, disabled, isSubmitted, checking, primaryLabel, primaryDisabled, onPrevious, onNext, onFlag, onPrimary }: {
  index: number; total: number; flagged: boolean; disabled: boolean; isSubmitted: boolean; checking: boolean; primaryLabel: string; primaryDisabled: boolean;
  onPrevious: () => void; onNext: () => void; onFlag: () => void; onPrimary: () => void;
}) {
  return <footer className="qx-footer" aria-label="Question navigation"><div>
    <button className="qx-button qx-previous" disabled={disabled || index === 0} onClick={onPrevious}><ExamIcon name="previous" /><span>Previous</span></button>
    {!isSubmitted && <button className={`qx-button qx-flag ${flagged ? "is-flagged" : ""}`} disabled={disabled} onClick={onFlag} aria-pressed={flagged} aria-label={flagged ? "Flagged for review" : "Flag for review"}><ExamIcon name="flag" /><span>{flagged ? "Flagged" : "Flag for review"}</span></button>}
    <span className="qx-footer-position">{index + 1} <span>of {total}</span></span>
    <button className="qx-button qx-next" disabled={disabled || index === total - 1} onClick={onNext}><span>Next</span><ExamIcon name="next" /></button>
    <button className="qx-button qx-primary qx-reveal" disabled={disabled || primaryDisabled} onClick={onPrimary} aria-busy={checking}>{checking && <span className="qx-spinner" aria-hidden="true" />}<span>{primaryLabel}</span>{!checking && <ExamIcon name={isSubmitted ? "grid" : "check"} />}</button>
  </div></footer>;
}

