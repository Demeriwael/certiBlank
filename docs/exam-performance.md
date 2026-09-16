# Exam performance

Answer selection, flags, and navigation update local state immediately. ExamSync persists the draft locally and batches background saves in a 750 ms window. Requests remain serialized to preserve version ordering. HTTP 429 responses respect Retry-After without blocking local interaction. Reveal and final submission still require authoritative server grading.

The countdown renders in its own component. The question palette mounts only while open. Setup reads question domains rather than full question/explanation records. Setup and saved-attempt requests run concurrently; resume can render before setup finishes. Save updates omit the immutable snapshot from the database response and reuse the already-authorized snapshot.

New clients request incremental feedback: ordinary saves omit explanations, checking returns that question's explanation, and the client merges it with previously received feedback. Resume and final review remain complete. Older clients retain the existing response format. Ownership checks, rate limits, and mock-answer redaction remain in place.

## Reproduce the payload comparison

```sh
node --import tsx tests/exam-performance.ts
```

Using the local AWS fixture with 65 checked domain questions:

| Comparison | Before | After |
| --- | ---: | ---: |
| Routine save JSON | 86,578 bytes | 3,371 bytes |
| Question data used for setup (fixture projection) | 340,078 bytes | 10,235 bytes |

These are approximately 96% and 97% reductions in serialized fixture data, not production latency measurements. The setup comparison excludes certification metadata and database protocol overhead. Browser QA used synthetic questions and a three-second fake save delay, including a 390-pixel mobile viewport. No test attempts were written to production.

## Deployment verification

After deployment, measure start, resume, save, reveal, and submit request timings on mobile and desktop, including cold starts and slow networks. Check keyboard navigation, draft recovery, and that mock answers remain hidden until submission. Record real-user interaction latency before claiming a production improvement. Hosting cold starts, database region/distance, and network latency still affect server-backed actions; this change does not promise zero latency.
