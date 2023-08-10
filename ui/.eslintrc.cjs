/* eslint-env node */

module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/restrict-template-expressions': [
      'warn',
      {
        /** Whether to allow `any` typed values in template expressions. */
        allowAny: true,
        /** Whether to allow `boolean` typed values in template expressions. */
        allowBoolean: true,
        /** Whether to allow `never` typed values in template expressions. */
        allowNever: true,
        /** Whether to allow `nullish` typed values in template expressions. */
        allowNullish: true,
        /** Whether to allow `number` typed values in template expressions. */
        allowNumber: true,
        /** Whether to allow `regexp` typed values in template expressions. */
        allowRegExp: true,
      },
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};
