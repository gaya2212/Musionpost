import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        'canvas-black': 'var(--color-canvas-black)',
        'canvas-elevated': 'var(--color-canvas-elevated)',
        'gradient-cyan': 'var(--color-gradient-cyan)',
        'gradient-magenta': 'var(--color-gradient-magenta)',
        'gradient-musion': 'var(--color-gradient-musion)',
        bg: 'var(--bg)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-section-alt': 'var(--bg-section-alt)',
        'text-body': 'var(--text-body)',
        'text-muted': 'var(--text-muted)',
      },
      backgroundImage: {
        'grad-cyan': 'var(--grad-cyan)',
        'grad-pink': 'var(--grad-pink)',
        'grad-brand': 'var(--grad-brand)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-jakarta)', 'sans-serif'],
        accent: ['var(--font-poppins)', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
