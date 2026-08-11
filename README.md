# TFT I–V · Vth Analyzer

Browser-only TFT transfer-curve analysis for NMOS and PMOS populations.

## Features

- Deterministic synthetic dataset: 100 NMOS + 100 PMOS, 81 points per device, with a mobility-degradation turnover for maximum-slope demonstration
- Multi-file CSV import; data stays in the browser
- Log/linear transfer curves and Vth distribution
- Configurable Ioff extraction at a specified Vg, on-curve marker, and log-current distribution
- Two selectable Vth definitions: maximum `|d|Id|/dVg|` and `|Id| = 10^-10 A`
- Spec yield, fit status, searchable device ledger, and CSV export
- Responsive static site for GitHub Pages

## CSV schema

Required: `device_id,type,Vg,Id`  
Optional: `Vd,W_um,L_um`

`type` accepts NMOS/PMOS. Signed PMOS current is supported; extraction uses `|Id|` while preserving the Vth sign.

Ioff is not treated as the raw minimum. The app interpolates `log10(|Id|)` at the configured gate voltage (default `Vg=0 V`) and exports both the current and evaluation voltage.

## Run locally

```bash
python3 -m http.server 8080
```

Open <http://localhost:8080>.

## Test

```bash
node --test test/core.test.mjs
```

## Scientific caution

Vth is method-dependent. The maximum-slope definition is sensitive to measurement noise and Vg spacing; the fixed-current definition assumes the same current convention across devices. Validate against the lab's measurement conditions and golden-device method before production disposition.
