/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],

  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    "./app/components/**/*.{js,ts,jsx,tsx}",
    "./app/components/layout/**/*.{js,ts,jsx,tsx}",
    "./app/components/assign/**/*.{js,ts,jsx,tsx}",
    "./app/components/layout/admin/command-palette/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			sidebar: 'var(--sidebar)',
  			'sidebar-foreground': 'var(--sidebar-foreground)',
  			topbar: 'var(--topbar)',
  			border: 'hsl(var(--border))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			'primary-foreground': 'var(--primary-foreground)',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			'accent-foreground': 'var(--accent-foreground)',
  			glow: 'var(--glow-color)',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		boxShadow: {
  			glow: '0 0 40px var(--glow-color)',
  			panel: '0 0 40px rgba(15,23,42,0.45)'
  		},
  		animation: {
  			scanline: 'scanline 4s linear infinite',
  			'blur-fade': 'blurFade 0.35s ease-out',
  			'page-in': 'pageIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
  			'page-out': 'pageOut 0.35s cubic-bezier(0.4, 0, 1, 1)',
  			shimmer: 'shimmer 2s infinite linear',
  			float: 'float 4s ease-in-out infinite'
  		},
  		keyframes: {
  			scanline: {
  				'0%': {
  					transform: 'translateY(-100%)'
  				},
  				'100%': {
  					transform: 'translateY(100%)'
  				}
  			},
  			blurFade: {
  				'0%': {
  					opacity: 0,
  					filter: 'blur(20px)',
  					transform: 'translateY(-10px)'
  				},
  				'100%': {
  					opacity: 1,
  					filter: 'blur(0px)',
  					transform: 'translateY(0px)'
  				}
  			},
  			pageIn: {
  				'0%': {
  					opacity: 0,
  					transform: 'translateY(20px) scale(0.97)',
  					filter: 'blur(8px)'
  				},
  				'100%': {
  					opacity: 1,
  					transform: 'translateY(0px) scale(1)',
  					filter: 'blur(0px)'
  				}
  			},
  			pageOut: {
  				'0%': {
  					opacity: 1,
  					transform: 'translateY(0px) scale(1)',
  					filter: 'blur(0px)'
  				},
  				'100%': {
  					opacity: 0,
  					transform: 'translateY(-20px) scale(0.95)',
  					filter: 'blur(8px)'
  				}
  			},
  			shimmer: {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(100%)'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-6px)'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },

  plugins: [require("tailwindcss-animate")],
};
