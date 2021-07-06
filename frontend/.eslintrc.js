module.exports = {
  root: true,
  env: {
    node: true
  },
  "extends": [
    "plugin:vue/vue3-essential",
    "eslint:recommended"
  ],
  rules: {
    'no-unused-vars': [2, {"args": "all", "argsIgnorePattern": "^_.*"}],
    'experimental-script-setup-vars': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    "vue/no-v-for-template-key": "off",
    "vue/no-v-for-template-key-on-child": 2,
    "vue/html-self-closing": "off" // Fix v-for/template/key bug
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}


