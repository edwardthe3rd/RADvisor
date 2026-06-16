import type { Config } from "tailwindcss";

// Brand palette aligned with radvisor-logo.png: gold yellow, lake blue, forest green.
// brand-primary (red) is reserved for primary CTAs — e.g. "Take the quiz".
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#FF5A5F",
          primaryDark: "#E04850",
          /** Muted red for hero quiz CTA — between primary and the darker soft red. */
          primarySoft: "#D45256",
          primarySoftDark: "#BE484C",
          primaryLight: "#FDF6E3",
          gold: "#EAB321",
          goldDark: "#C99510",
          goldLight: "#FDF6E3",
          secondary: "#1A7B9E",
          secondaryDark: "#145F7A",
          secondaryLight: "#E3F2F7",
          tertiary: "#2D8B57",
          tertiaryLight: "#E8F5EE",
          accent: "#1B6B4A",
          accentLight: "#E8F5EE",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          background: "#FAFCFD",
          backgroundAlt: "#F4F8FA",
          card: "#FFFFFF",
          border: "#D4E2E8",
          borderLight: "#E8F0F4",
          muted: "#F0F5F7",
        },
        hero: {
          gold: "#F0DFA0",
          lake: "#8EC5DA",
          pine: "#C8E6D4",
        },
        ink: {
          primary: "#1A2B33",
          secondary: "#5C6F7A",
          tertiary: "#9AABB5",
          inverse: "#FFFFFF",
          link: "#1A7B9E",
        },
        feedback: {
          success: "#2D8B57",
          warning: "#E07912",
          danger: "#C13515",
          info: "#1A7B9E",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      maxWidth: {
        content: "1200px",
      },
      fontFamily: {
        roboto: ["var(--font-roboto)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
