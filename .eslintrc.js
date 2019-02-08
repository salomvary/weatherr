module.exports = {
  "env": {
    "browser": true,
    "es6": true
  },
  "extends": "standard",
  "parserOptions": {
    "ecmaVersion": 8,
    "sourceType": "module"
  },
  "rules": {
    "array-bracket-spacing": ["error", "never"],
    "object-curly-spacing": ["error", "never"],
    "no-unused-vars": ["error", { "args": "after-used" }]
  }
};
