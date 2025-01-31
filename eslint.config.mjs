// @ts-check

import globals from 'globals';
import eslintJs from '@eslint/js';
import eslintTs from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
const eslintConfigPrettierTypeForced = (() => {
  /** @type {any} */
  const eslintConfigPrettierAsAny = eslintConfigPrettier;
  return eslintConfigPrettierAsAny;
})();

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
  eslintJs.configs.recommended,
  ...eslintTs.configs.recommended,
  eslintConfigPrettierTypeForced,
  {
    files: ['**/*.{ts,ts,tsx,js,mjs,jsx}'],
    plugins: {},
    languageOptions: {
      globals: { ...globals.browser },
      parser: eslintTs.parser,
      ecmaVersion: 5,
      sourceType: 'script',
    },
    /** @type {Partial<import("eslint/rules").ESLintRules>} */
    rules: {
      ['no-shadow']: 'off',
      ['comma-dangle']: 'off',
      ['radix']: 'off',
      ['no-use-before-define']: 'off',
      ['no-constant-condition']: 'off',
      ['no-unused-vars']: 'off',
      ['no-unused-expressions']: 'off',
      ['no-await-in-loop']: 'off',
      ['no-empty']: 'off',
      ['no-continue']: 'off',
      ['require-yield']: 'off',
      ['@typescript-eslint/require-yield']: 'off',
      ['@typescript-eslint/no-explicit-any']: 'off',
      ['@typescript-eslint/no-non-null-assertion']: 'off',
      ['@typescript-eslint/no-empty-function']: 'off',
      ['@typescript-eslint/no-this-alias']: 'off',
      ['@typescript-eslint/no-unused-expressions']: 'warn',
      ['@typescript-eslint/no-unused-vars']: [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },
];
