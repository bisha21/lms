import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/_component/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))',
  				soft: 'hsl(var(--destructive-soft))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				soft: 'hsl(var(--success-soft))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				soft: 'hsl(var(--warning-soft))'
  			},
  			rating: 'hsl(var(--rating))',
  			wishlist: 'hsl(var(--wishlist))',
  			brand: {
  				DEFAULT: 'hsl(var(--brand))',
  				foreground: 'hsl(var(--brand-foreground))'
  			},
  			palette: {
  				'1': { DEFAULT: 'hsl(var(--palette-1))', soft: 'hsl(var(--palette-1-soft))' },
  				'2': { DEFAULT: 'hsl(var(--palette-2))', soft: 'hsl(var(--palette-2-soft))' },
  				'3': { DEFAULT: 'hsl(var(--palette-3))', soft: 'hsl(var(--palette-3-soft))' },
  				'4': { DEFAULT: 'hsl(var(--palette-4))', soft: 'hsl(var(--palette-4-soft))' },
  				'5': { DEFAULT: 'hsl(var(--palette-5))', soft: 'hsl(var(--palette-5-soft))' },
  				'6': { DEFAULT: 'hsl(var(--palette-6))', soft: 'hsl(var(--palette-6-soft))' }
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			float: {
  				'0%, 100%': { transform: 'translateY(0) translateX(0)' },
  				'50%': { transform: 'translateY(-16px) translateX(8px)' }
  			},
  			'float-slow': {
  				'0%, 100%': { transform: 'translateY(0) translateX(0)' },
  				'50%': { transform: 'translateY(14px) translateX(-10px)' }
  			},
  			shine: {
  				'0%': { backgroundPosition: '200% center' },
  				'100%': { backgroundPosition: '-200% center' }
  			}
  		},
  		animation: {
  			float: 'float 8s ease-in-out infinite',
  			'float-slow': 'float-slow 11s ease-in-out infinite',
  			shine: 'shine 3s linear infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
