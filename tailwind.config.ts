import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      ringColor: {
        "focus-ring": "hsl(var(--focus-ring))",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        edited: "hsl(var(--edited))",
        "new-item": "hsl(var(--new-item))",
        "focus-ring": "hsl(var(--focus-ring))",
        "focus-bg": "hsl(var(--focus-bg))",
        "focus-linked": "hsl(var(--focus-linked))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "outline-fade": {
          "0%, 80%": {
            boxShadow: "inset 0 0 0 2px hsl(217 91% 60%)",
          },
          "100%": {
            boxShadow: "inset 0 0 0 2px transparent",
          },
        },
        "outline-fade-top": {
          "0%, 80%": {
            boxShadow: "inset 2px 2px 0 0 hsl(217 91% 60%), inset -2px 0 0 0 hsl(217 91% 60%)",
          },
          "100%": {
            boxShadow: "inset 2px 2px 0 0 transparent, inset -2px 0 0 0 transparent",
          },
        },
        "outline-fade-middle": {
          "0%, 80%": {
            boxShadow: "inset 2px 0 0 0 hsl(217 91% 60%), inset -2px 0 0 0 hsl(217 91% 60%)",
          },
          "100%": {
            boxShadow: "inset 2px 0 0 0 transparent, inset -2px 0 0 0 transparent",
          },
        },
        "outline-fade-bottom": {
          "0%, 80%": {
            boxShadow: "inset 2px -2px 0 0 hsl(217 91% 60%), inset -2px 0 0 0 hsl(217 91% 60%)",
          },
          "100%": {
            boxShadow: "inset 2px -2px 0 0 transparent, inset -2px 0 0 0 transparent",
          },
        },
        "slide-in-from-right": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-from-left": {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "outline-fade": "outline-fade 2.5s ease-out forwards",
        "outline-fade-top": "outline-fade-top 2.5s ease-out forwards",
        "outline-fade-middle": "outline-fade-middle 2.5s ease-out forwards",
        "outline-fade-bottom": "outline-fade-bottom 2.5s ease-out forwards",
        "slide-in-from-right": "slide-in-from-right 0.2s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addVariant }: { addVariant: (name: string, definition: string) => void }) {
      addVariant('can-hover', '@media (hover: hover) and (pointer: fine)');
    },
  ],
} satisfies Config;
