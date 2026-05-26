/** @type {import('tailwindcss').Config} */
const rgbVar = (value) => `rgb(var(${value}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      spacing: {
        layout: "2rem",
        section: "1.5rem",
        card: "1.25rem",
        control: "0.75rem",
        "control-lg": "1rem",
      },
      borderRadius: {
        control: "0.75rem",
        card: "1rem",
        panel: "1.25rem",
        shell: "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px rgb(15 23 42 / 0.08)",
        card: "0 1px 2px rgb(15 23 42 / 0.05), 0 10px 30px rgb(15 23 42 / 0.08)",
        panel: "0 12px 32px rgb(15 23 42 / 0.10)",
        modal: "0 24px 64px rgb(15 23 42 / 0.18)",
        insetSoft: "inset 0 1px 2px rgb(15 23 42 / 0.08)",
      },
      fontSize: {
        "page-title": [
          "1.875rem",
          {
            lineHeight: "2.25rem",
            letterSpacing: "-0.03em",
            fontWeight: "600",
          },
        ],
        "section-title": [
          "1.25rem",
          {
            lineHeight: "1.75rem",
            letterSpacing: "-0.02em",
            fontWeight: "600",
          },
        ],
        body: ["0.9375rem", { lineHeight: "1.5rem" }],
        label: [
          "0.75rem",
          { lineHeight: "1rem", letterSpacing: "0.08em", fontWeight: "600" },
        ],
        caption: [
          "0.6875rem",
          { lineHeight: "1rem", letterSpacing: "0.08em", fontWeight: "500" },
        ],
      },
      colors: {
        canvas: rgbVar("--color-canvas"),
        surface: rgbVar("--color-surface"),
        "surface-muted": rgbVar("--color-surface-muted"),
        border: rgbVar("--color-border"),
        ink: rgbVar("--color-ink"),
        muted: rgbVar("--color-muted"),
        accent: {
          50: rgbVar("--color-accent-50"),
          100: rgbVar("--color-accent-100"),
          500: rgbVar("--color-accent-500"),
          600: rgbVar("--color-accent-600"),
          900: rgbVar("--color-accent-900"),
        },
        primary: {
          50: rgbVar("--color-primary-50"),
          100: rgbVar("--color-primary-100"),
          500: rgbVar("--color-primary-500"),
          600: rgbVar("--color-primary-600"),
          900: rgbVar("--color-primary-900"),
        },
        success: {
          50: rgbVar("--color-success-50"),
          100: rgbVar("--color-success-100"),
          600: rgbVar("--color-success-600"),
          900: rgbVar("--color-success-900"),
        },
        warning: {
          50: rgbVar("--color-warning-50"),
          100: rgbVar("--color-warning-100"),
          600: rgbVar("--color-warning-600"),
          900: rgbVar("--color-warning-900"),
        },
        danger: {
          50: rgbVar("--color-danger-50"),
          100: rgbVar("--color-danger-100"),
          600: rgbVar("--color-danger-600"),
          900: rgbVar("--color-danger-900"),
        },
      },
    },
  },
  plugins: [],
};
