# PageSpeed Log

Tracks Google PageSpeed Insights (Lighthouse) scores across the Editorial
Luxury premium-uplift build. Post-change scores are captured at each phase
gate by the controller (deployment/PageSpeed run isn't available inside this
task's execution environment).

| Date | URL | Mobile | Desktop | LCP | TBT | CLS | Notes |
|------|-----|--------|---------|-----|-----|-----|-------|
| 2026-07-13 | / | 95* | 100* | — | — | — | *Unverified carry-over from prior audit — NOT a fresh measurement. Fresh PSI run attempted 2026-07-13, blocked by anonymous API daily quota. Real baseline + vitals to be captured at the Phase 2 gate (production still serves pre-uplift main until merge, so the baseline stays valid). |
| 2026-07-13 | /retreats/[slug] | — | — | — | — | — | Baseline pending same PSI run as above. |
| 2026-07-13 | /retreats/kamalaya-koh-samui (LOCAL harness, phase 2 gate) | 83 | 98 | 4.7s | 0ms | 0 | NEW design, local `next start` + Lighthouse 12 mobile/desktop. Calibration: OLD production page on the SAME local harness = mobile 74, LCP 5.2s, TBT 280ms, script eval 1169ms (new: 351ms). Redesign is faster than live on identical yardstick → gate PASS. Absolute PSI numbers re-verified on Vercel preview at merge. |
| 2026-07-14 | LIVE post-merge (local LH12 harness) | home 92 / detail 76 | home 97 | home 3.1s / detail 5.0s | 40ms / 120ms | 0 | Production deploy 2a6875e READY. Same harness that scored OLD prod detail = 74 / TBT 280ms → redesign faster live. Detail LCP (split-hero ambience image, cold cache) is the next optimization target. PSI API quota-blocked again; re-run PSI when quota resets. |
