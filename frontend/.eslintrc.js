module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
     "plugin:vue/base"
  ],
  rules: {
    'no-unused-vars': [2, {"args": "all", "argsIgnorePattern": "^_.*"}],
   //  'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'experimental-script-setup-vars': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
