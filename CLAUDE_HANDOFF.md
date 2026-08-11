# Claude handoff — TFT I–V · Vth Analyzer

Updated: 2026-08-11  
Scope: read this file only; older conversation context is not required.

## Current state

- Repository: `https://github.com/waterfirst/tft-iv-vth-analyzer`
- Live page: `https://waterfirst.github.io/tft-iv-vth-analyzer/`
- Latest implementation commit: `0a9a298`
- Working tree was clean after push.

## User-approved behavior

The UI exposes exactly two clickable Vth definitions:

1. **Maximum slope** — return the measured `Vg` where `|d|Id|/dVg|` is maximum.
   - Uses central differences on interior points.
   - Excludes the two sweep endpoints because a centered derivative is unavailable there.
   - Uses `|Id|` and preserves the signed NMOS/PMOS `Vg` result.
2. **Fixed current** — return the interpolated `Vg` where `|Id| = 1e-10 A`.
   - The criterion is fixed, not user-editable.
   - Interpolation is linear in `log10(|Id|)`.

Interpretation note: the implementation treats the user's phrase “Id/Vg 기울기” as the slope of the Id–Vg curve, `d|Id|/dVg`, not the derivative of the quotient `Id/Vg`. Ask only if the user explicitly challenges this interpretation.

## Other retained behavior

- CSV import stays browser-only.
- NMOS/PMOS filters, log/linear plots, Vth distribution, spec limits and result CSV remain.
- Ioff remains configurable at a selected `Vg`, using log-current interpolation; it appears in the summary, transfer plot, distribution toggle, table and CSV.
- Synthetic examples remain 100 NMOS + 100 PMOS. Their above-threshold term includes mobility degradation so the maximum-slope demonstration does not collapse to the sweep endpoint.

## Verification completed

- Unit tests: `7/7` passed.
- Playwright: desktop + mobile + CSV import + method switching passed.
- GitHub Pages deployment for `0a9a298`: success.
- Remote mobile check:
  - Method buttons: 2
  - Maximum-slope mean: `N 3.54 V`, `P -3.77 V`
  - Fixed-current mean: `N 2.44 V`, `P -2.66 V`
  - Horizontal overflow: none

## Claude role

- Review only unless the user asks for a new change.
- Do not restore the removed sqrt-current extrapolation or W/L-normalized criterion.
- If reviewing scientific validity, distinguish “implemented user definition” from a standardized threshold-voltage extraction method; do not silently redefine it.
