const { functions } = require('@nikifilini/maidencss')

module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-nested'),
    require('postcss-extend'),
    require('postcss-functions')({
      functions,
    }),
  ],
}
