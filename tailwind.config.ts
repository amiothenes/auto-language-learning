import type { Config } from 'tailwindcss'

// Tailwind CSS v4 - Minimal config (theme is defined in globals.css using @theme)
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
}

export default config
