/**
 * Tokens-only styling (CLAUDE.md rule 3, ADR-0009).
 * Colours, type, spacing, radius and shadow must come from var(--…) tokens.
 */
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  ignoreFiles: ['src/styles/tokens.css', 'dist/**'],
  rules: {
    // CSS Modules use camelCase class names.
    'selector-class-pattern': null,
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch'],
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/',
        'fill',
        'stroke',
        'font-family',
        'font-size',
        'font-weight',
        'line-height',
        'letter-spacing',
        'border-radius',
        'box-shadow',
        '/^(margin|padding)/',
        'gap',
        'row-gap',
        'column-gap',
      ],
      {
        ignoreValues: [
          '0', 'auto', 'inherit', 'initial', 'unset', 'currentcolor', 'transparent', 'none', 'normal',
          // calc() built only from tokens, unitless numbers and operators, e.g. calc(var(--space-1) * -1).
          '/^calc\\((?:\\s|var\\(--[\\w-]+\\)|[-+*/()]|\\d+(?:\\.\\d+)?)+\\)$/',
          // Runtime client tint: color-mix(in srgb, var(--pill-colour) var(--mix), var(--surface)).
          '/^color-mix\\(in srgb, var\\(--[\\w-]+\\) var\\(--[\\w-]+\\), var\\(--[\\w-]+\\)\\)$/',
        ],
        ignoreFunctions: false,
        disableFix: true,
        message: 'Use a design token (var(--…)) for "${property}" — see docs/design/tokens (CLAUDE.md rule 3).',
      },
    ],
  },
};
