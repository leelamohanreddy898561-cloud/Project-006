# Evidence — Proof of Work

Every verification run is appended here as a new dated entry, newest first.
Never edit or delete past entries — append a new one after a re-run.

## Entry format

```md
## YYYY-MM-DD — <short title> (R#)

**Test cases:** TC-xxx, TC-xxx
**Commands run:**

    npm run build
    npx playwright test

**Results:**

| Test case | Result | Notes |
| --- | --- | --- |
| TC-001 | pass | dev server started in 415 ms |
| TC-002 | fail | TS6133 unused import in Header.tsx |

**Artifacts:** playwright-report/index.html, evidence/screenshots/<file>.png
**Evaluation:** <what passed, what failed, what was done about it>
**Commit:** <short SHA>
```

Artifacts (screenshots, downloaded reports) are stored under `evidence/`.

---

## Runs

_No verification runs yet. The first entry will be added when R0 is executed._
