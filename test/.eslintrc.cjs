module.exports = {
  'env': {
    'browser': true,
    'mocha': true,
    'node': true
  },
  'extends': '../.eslintrc.cjs',
  'globals': {
    'expect': false,
    'sinon': false
  },
  'rules': {
    'brace-style': ['error', 'stroustrup', { 'allowSingleLine': true }],
    // Disable no-unused-expressions for chai expectations
    'no-unused-expressions': 'off',
    'newline-after-var': 'off',
    'max-len': 'off'
  }
};
