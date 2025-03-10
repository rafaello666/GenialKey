// Plik: server/.eslintrc.js
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: ['tsconfig.json'], // lub 'tsconfig.build.json' w zależności, co wolisz
      sourceType: 'module'
    },
    plugins: [
      '@typescript-eslint',
      'prettier'
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended' // Połączenie ESLint + Prettier
    ],
    rules: {
      // Przykładowe reguły do zaostrzenia stylu:
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'prettier/prettier': [
        'error',
        {
          'endOfLine': 'auto'
        }
      ]
    }
  };
  