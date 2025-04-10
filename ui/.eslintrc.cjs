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
  overrides: [
    {
      files: ['src/pages/products/rjsf/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'react-refresh/only-export-components': 'off',
        'no-empty-pattern': 'off',
      },
    },
  ],
};
