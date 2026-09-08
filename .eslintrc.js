module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true,
    // Without this every describe/test/expect in tests/ is a no-undef
    // error, which is why a test file previously carried a blanket
    // `/* eslint-disable no-undef */` just to be lintable.
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'airbnb',
    'plugin:react/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
  },
};
