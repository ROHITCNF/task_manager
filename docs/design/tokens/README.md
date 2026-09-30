# Design Tokens

Source of truth for the UI's design tokens.

## What goes here

- Color palette (including light/dark themes)
- Typography scale (font families, sizes, weights, line heights)
- Spacing, sizing, radius, shadow, and z-index scales
- Motion tokens (durations, easings)
- Breakpoints

## Conventions

- Store tokens as JSON (e.g. `colors.json`, `typography.json`) so they can be turned into CSS variables or theme files later
- Use semantic names (`color.text.primary`) over raw values (`gray-900`) wherever components consume them
