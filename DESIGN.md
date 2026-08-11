---
name: TFT I–V / Vth Analyzer
description: A bright probe-station workbench for auditable TFT population analysis.
colors:
  ink-blue: "#0b1f35"
  instrument-muted: "#5d6d7f"
  hairline: "#d7e0e8"
  bench-paper: "#f4f7f9"
  surface-white: "#ffffff"
  nmos-cyan: "#087f8c"
  nmos-soft: "#d8f1f2"
  pmos-magenta: "#b63d72"
  pmos-soft: "#f9dce8"
  ioff-amber: "#d77a16"
  pass-green: "#16724b"
  fail-red: "#b62932"
  action-cyan: "#63d8da"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(30px, 4.2vw, 60px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "10px"
    fontWeight: 800
    lineHeight: 1.4
    letterSpacing: "0.05em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  chip: "6px"
  field: "9px"
  control: "10px"
  drop-zone: "12px"
  surface: "14px"
spacing:
  xs: "8px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "30px"
components:
  button-primary:
    backgroundColor: "{colors.action-cyan}"
    textColor: "{colors.ink-blue}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "40px"
  button-secondary:
    backgroundColor: "#17324d"
    textColor: "#e6eef5"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "40px"
  field:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-blue}"
    typography: "{typography.mono}"
    rounded: "{rounded.field}"
    padding: "0 10px"
    height: "38px"
  surface-card:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-blue}"
    rounded: "{rounded.surface}"
    padding: "18px"
  chip-nmos:
    backgroundColor: "{colors.nmos-soft}"
    textColor: "#075c66"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "3px 7px"
  chip-pmos:
    backgroundColor: "{colors.pmos-soft}"
    textColor: "#87284f"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "3px 7px"
---

# Design System: TFT I–V / Vth Analyzer

## Overview

**Creative North Star: "The Probe-Station Workbench"**

This is a bright, compact engineering instrument rather than a dashboard of detached metric cards. Ink-blue structure anchors a paper-gray workbench; phosphor cyan and magenta make NMOS and PMOS populations legible without turning the screen into decoration.

The system prioritizes scanability, traceability, and defensible decisions. Dense controls remain calm through a tight type ramp, repeated 18px rhythm, continuous chart-and-ledger surfaces, and color that is reserved for device polarity, state, and action.

**Key Characteristics:**
- Bright laboratory workbench with ink-blue instrument structure.
- Dense but ordered Operate-mode hierarchy.
- Cyan NMOS and magenta PMOS as a persistent analytic pairing.
- Rounded white surfaces with restrained ambient lift.
- Monospaced measurement entry and tabular numeric output.

## Colors

The palette combines cool paper neutrals with a dark structural ink and two high-clarity device channels.

### Primary
- **Ink Blue:** Structural color for the sticky instrument bar, aggregate status strip, hover labels, and primary text.
- **Phosphor NMOS Cyan:** NMOS curves, selection accents, focus treatment, and interactive cues.

### Secondary
- **PMOS Magenta:** PMOS curves and type identity; it remains analytic rather than decorative.
- **Action Cyan:** High-emphasis import actions against ink-blue chrome.
- **Ioff Amber:** Reserved for the selected curve's off-current point and annotation; never a third device category.

### Neutral
- **Bench Paper:** Page canvas that separates white working surfaces without borders everywhere.
- **Surface White:** Charts, controls, ledger, and explanatory containers.
- **Instrument Muted:** Secondary copy, captions, units, and low-priority metadata.
- **Hairline:** Quiet separators and dataset readout rules.

### Named Rules
**The Two-Channel Rule.** Cyan denotes NMOS or active interaction; magenta denotes PMOS. Do not swap or reuse this pair for unrelated categories.

**The Ink Structure Rule.** Ink blue is structural and informational, not a general-purpose filled-card color; use it for app chrome, aggregate status, and transient feedback.

## Typography

**Display Font:** Pretendard Variable (with platform sans-serif fallbacks)  
**Body Font:** Pretendard Variable (with platform sans-serif fallbacks)  
**Label/Mono Font:** UI monospace for measurement values and code-like data

**Character:** A single compact sans-serif family keeps the instrument neutral and highly scannable. Weight, size, tabular numerals, and monospace—not decorative font pairing—create hierarchy.

### Hierarchy
- **Display:** Heavy, tightly tracked, near-solid leading; reserved for the one-page analytical proposition.
- **Headline:** Compact aggregate values in the dark status strip.
- **Title:** Panel headings and primary section labels.
- **Body:** Dense explanatory and operational copy; use generous line height for caveats.
- **Label:** Small, bold, often uppercase metadata and table headings.
- **Mono:** User-entered criteria, units-adjacent values, and code-like field names.

### Named Rules
**The Instrument Hierarchy Rule.** Use only one display statement; everything inside the workbench steps down to title, body, label, or mono roles.

## Layout

The desktop shell is centered to a 1680px maximum and pairs a sticky 300px control rail with a fluid analysis area at an 18px gap. The analysis area keeps aggregate status continuous, then divides charts at roughly 1.65:0.75 before returning to a full-width extraction ledger.

At 1120px the rail narrows to 270px, charts stack, and four-column notes become two columns. At 760px the workbench becomes a single vertical flow, the control rail loses stickiness, status becomes a two-column grid, charts reduce to 360px height, notes become one column, and lower-priority ledger columns are hidden. The minimum supported canvas is 320px.

**The Continuous Evidence Rule.** Keep summary, plots, and ledger in one reading path; do not fragment them into independent dashboard tiles.

## Elevation & Depth

The system uses a hybrid of tonal layering and restrained ambient lift. White work surfaces sit on bench paper with a single soft surface shadow; stronger depth is reserved for the sticky top bar and transient toast. Active segmented controls use only a small local lift.

### Shadow Vocabulary
- **Surface Ambient:** Soft blue-black diffusion for control, chart, ledger, and notes surfaces.
- **Sticky Chrome:** Stronger downward shadow under the fixed ink-blue top bar.
- **Selected Control:** Compact shadow that makes the active segmented option read as a physical switch.
- **Focus Halo:** Cyan three-pixel outline or inset-adjacent ring for keyboard and field focus.

**The Ambient-Only Rule.** Shadows clarify surface level and interaction state; they never become decorative hard offsets.

## Shapes

The form language is gently instrument-like: 14px outer surfaces, 9–10px controls and fields, 6px status/type chips, and a 12px dashed drop zone. Thin cool borders describe fields and internal divisions; large panels rely on fill and shadow. Charts remain rectangular inside rounded containers so axes and data retain maximum usable area.

## Components

### Buttons
- **Shape:** Compact rounded controls with a 40px minimum height.
- **Primary:** Bright cyan fill with ink-blue text for the file-import action.
- **Secondary:** Dark blue fill and cool border inside the top bar; low-emphasis full-width actions use a pale blue-gray fill.
- **Hover / Focus:** One-pixel upward movement plus a short color transition; keyboard focus receives a cyan outline. Reduced-motion mode removes transitions.

### Chips
- **Style:** Six-pixel rounded tags with dense bold label text.
- **State:** Device-type chips use soft cyan or soft magenta; specification chips use green, red, or neutral gray for pass, fail, and no-fit states.

### Cards / Containers
- **Corner Style:** Gently rounded outer surfaces.
- **Background:** White against bench paper; ink blue only for aggregate status.
- **Shadow Strategy:** One ambient surface shadow, without nested floating cards.
- **Border:** Hairlines divide headings, rows, and metric cells.
- **Internal Padding:** An 18px default rhythm.

### Inputs / Fields
- **Style:** White, bordered, 38px fields with monospaced values and a softly tinted unit cell.
- **Focus:** Border changes to NMOS cyan and gains a translucent three-pixel halo.
- **Error / Disabled:** Failures use the established red state; unavailable results use the neutral no-fit chip rather than color alone.

### Navigation

The sticky 68px top bar is functional chrome: compact brand at left, privacy state and import/export actions at right. On narrow screens, privacy text and the secondary example-download action disappear while the primary import action remains.

### Segmented Controls

Three-pixel inset tracks hold flat inactive labels and one white, softly lifted active option. Keep labels short enough to scan at 11px and preserve `aria-pressed` state.

### Extraction Ledger

The ledger uses sticky uppercase headers, tabular numerals, hairline row separation, and a pale cyan hover/selection band. A selected row is evidence-linked to the emphasized transfer curve; preserve that cross-view relationship.

## Do's and Don'ts

### Do:
- **Do** preserve the cyan-NMOS and magenta-PMOS mapping across curves, chips, annotations, and filters.
- **Do** keep extraction method, fit state, thresholds, and caveats visible near the analytical evidence.
- **Do** use the repeated 18px rhythm for workbench gaps and primary surface padding.
- **Do** retain strong keyboard focus and the reduced-motion override.

### Don't:
- **Don't** split aggregate evidence into a field of detached metric cards.
- **Don't** use PMOS magenta as a generic accent or action color.
- **Don't** add decorative gradients, hard offset shadows, or ornamental display type to the laboratory workbench.
- **Don't** hide failure, no-fit, method, or source provenance behind color alone.
