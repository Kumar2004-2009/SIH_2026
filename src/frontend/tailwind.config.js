export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neutral scale — warm gray (not pure black/white)
        surface: {
          base:    '#111110',  // page background
          raised:  '#18181a',  // card / panel
          overlay: '#1f1f21',  // hover, input, nested panel
          border:  '#2a2a2d',  // 1px border
          muted:   '#38383c',  // disabled border, divider
        },
        // One accent — teal, used sparingly
        accent: {
          DEFAULT: '#0f7a72',
          hover:   '#0d6b63',
          subtle:  '#0f7a7215',
          text:    '#4ecdc4',
        },
        // Text scale
        text: {
          primary:   '#e8e8e6',
          secondary: '#a8a8a4',
          muted:     '#6b6b68',
          inverse:   '#111110',
        },
        // Semantic — status only
        severity: {
          critical: '#e54d2e',
          high:     '#e0813a',
          medium:   '#c4a030',
          low:      '#5b9e6e',
          info:     '#6b6b68',
        },
        sev: {
          'critical-bg':     '#3b1712',
          'critical-border': '#8c2519',
          'critical-text':   '#f07050',
          'high-bg':         '#381a10',
          'high-border':     '#8b4015',
          'high-text':       '#e09050',
          'medium-bg':       '#31270a',
          'medium-border':   '#7a6020',
          'medium-text':     '#c8a840',
          'low-bg':          '#0c2a18',
          'low-border':      '#1e6035',
          'low-text':        '#4db878',
          'info-bg':         '#1c1c1f',
          'info-border':     '#2a2a2d',
          'info-text':       '#8a8a88',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '16px' }],
        xs:    ['12px', { lineHeight: '16px' }],
        sm:    ['13px', { lineHeight: '20px' }],
        base:  ['14px', { lineHeight: '20px' }],
        md:    ['16px', { lineHeight: '24px' }],
        lg:    ['20px', { lineHeight: '28px' }],
        xl:    ['28px', { lineHeight: '36px' }],
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '4px',
        md: '5px',
        lg: '6px',
      },
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
