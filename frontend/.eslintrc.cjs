/* eslint-env node */
module.exports = {
  "root": true,
  "extends": [
    "plugin:vue/vue3-essential",
    "eslint:recommended"
  ],
  "env": {
    "vue/setup-compiler-macros": true
  },
  "rules": {
    'no-unused-vars': [2, {"args": "all", "argsIgnorePattern": "^_.*"}],
    'vue/multi-word-component-names': 'off',
    "vue/no-v-for-template-key-on-child": 2,
  }
}
