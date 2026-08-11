# TFT I–V · Vth Analyzer

Browser-only TFT transfer-curve analysis for NMOS and PMOS populations.

## Features

- Deterministic synthetic dataset: 100 NMOS + 100 PMOS, 81 points per device
- Multi-file CSV import; data stays in the browser
- Log/linear transfer curves and Vth distribution
- Constant-current and sqrt(|Id|) saturation-regime extraction
- Spec yield, fit status, searchable device ledger, and CSV export
- Responsive static site for GitHub Pages

## CSV schema

Required: `device_id,type,Vg,Id`  
Optional: `Vd,W_um,L_um`

`type` accepts NMOS/PMOS. Signed PMOS current is supported; extraction uses `|Id|` while preserving the Vth sign.

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

Vth is method-dependent. Constant-current results depend on the chosen current and normalization; sqrt-current extrapolation assumes saturation behavior. Validate against the lab's measurement condition and golden-device method before production disposition.
