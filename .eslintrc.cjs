module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: ['./apps/api/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    'no-console': 'warn',
  },
};
