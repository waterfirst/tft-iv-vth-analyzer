# TFT I–V / Vth Analyzer

## Purpose
A browser-only engineering tool that imports TFT transfer curves, visualizes NMOS and PMOS populations, and extracts threshold voltage without uploading confidential measurements.

## Primary user
Display-device and quality engineers reviewing device-to-device electrical variation on desktop or mobile.

## Core jobs
- Load CSV transfer data with `device_id,type,Vg,Id` and optional `Vd,W_um,L_um`.
- Inspect linear and log-current transfer curves for many devices.
- Extract Vth by constant-current and linear-extrapolation methods.
- Compare NMOS/PMOS distributions, flag outliers, and export results.
- Start immediately with deterministic synthetic examples: 100 NMOS and 100 PMOS devices.

## Constraints
- Static GitHub Pages deployment; no backend and no data upload.
- Synthetic examples must be visibly labeled.
- Extraction method, parameters, failed fits, and caveats must remain visible.
- Responsive, keyboard-accessible, and practical for dense engineering data.
