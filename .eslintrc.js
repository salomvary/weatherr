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
  },
  "overrides": [{
    // Make sure the feature checking code in lib/error-message runs on
    // older browsers too as it checks for the presence of ES6 too
    "files": ["loading-error.js"],
    "env": {
      "es6": false
    },
    "parserOptions": {
      "ecmaVersion": 5,
      "sourceType": "script"
    }
  }]
};
