const merge = require('@nikifilini/codestyle/tools')
const react = require('@nikifilini/codestyle/configs/eslint/react')

module.exports = merge(react, {
  env: { node: true },
  plugins: ['react', 'unused-imports'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: 'styles',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
  },
})
