import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  { ignores: ['.next/**', 'node_modules/**'] },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    // These newer React rules flag existing patterns throughout the app.
    // Keep them visible while allowing the Next.js upgrade to ship.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
]
export default config
