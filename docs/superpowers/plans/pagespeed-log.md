# PageSpeed Log

Tracks Google PageSpeed Insights (Lighthouse) scores across the Editorial
Luxury premium-uplift build. Post-change scores are captured at each phase
gate by the controller (deployment/PageSpeed run isn't available inside this
task's execution environment).

| Date | URL | Mobile | Desktop | LCP | TBT | CLS | Notes |
|------|-----|--------|---------|-----|-----|-----|-------|
| 2026-07-13 | / | 95* | 100* | — | — | — | *Unverified carry-over from prior audit — NOT a fresh measurement. Fresh PSI run attempted 2026-07-13, blocked by anonymous API daily quota. Real baseline + vitals to be captured at the Phase 2 gate (production still serves pre-uplift main until merge, so the baseline stays valid). |
| 2026-07-13 | /retreats/[slug] | — | — | — | — | — | Baseline pending same PSI run as above. |
