import { defineSchema } from '@nikifilini/maidencss'

const schema = defineSchema({
  // asdf: 123,
  out: './src/maidencss',
  colors: {
    _extend: 'windi',
    palette: {
      white: '#FFFFFF',
      black: '#171717',
      text: 'var(--black)',
      'text-inactive': 'rgba(0, 0, 0, 0.64)',
      brand: '#FFB423',
      accent: '#FA1833',
    },
  },
  spacings: {
    default: {
      1: '6px',
      2: '12px',
      3: '18px',
      4: '24px',
      5: '50px',
      add: 6,
    },
    margin: {
      short: 'm',
      xy: true,
    },
    padding: {
      short: 'p',
      xy: true,
    },
    gap: {
      short: 'gap',
    },
  },
})

export default schema
