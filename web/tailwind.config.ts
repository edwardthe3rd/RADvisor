import type { Config } from "tailwindcss";

// Design tokens ported from the former Expo app (mobile/src/theme/colors.ts,
// spacing.ts) so the web app keeps brand parity.
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
          primaryLight: "#FFE8E9",
          secondary: "#00A699",
          secondaryLight: "#E0F7F5",
          tertiary: "#FC642D",
          tertiaryLight: "#FFF0EB",
          accent: "#1B6B4A",
          accentLight: "#E8F5EE",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          background: "#FFFFFF",
          backgroundAlt: "#F7F7F7",
          card: "#FFFFFF",
          border: "#DDDDDD",
          borderLight: "#EBEBEB",
          muted: "#F5F5F5",
        },
        ink: {
          primary: "#222222",
          secondary: "#717171",
          tertiary: "#B0B0B0",
          inverse: "#FFFFFF",
          link: "#008489",
        },
        feedback: {
          success: "#008A05",
          warning: "#E07912",
          danger: "#C13515",
          info: "#428BFF",
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
    },
  },
  plugins: [],
};
export default config;
