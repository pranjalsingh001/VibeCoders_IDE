// design-system.ts
// ----------------
// Design system tokens and component configurations
// Centralizes styling constants for consistent UI

export const designTokens = {
    // Color palette
    colors: {
        primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554'
        },
        secondary: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617'
        },
        success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d'
        },
        warning: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f'
        },
        error: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d'
        },
        neutral: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#e5e5e5',
            300: '#d4d4d4',
            400: '#a3a3a3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
            950: '#0a0a0a'
        }
    },

    // Typography scale
    typography: {
        fontSizes: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
            '5xl': '3rem',
            '6xl': '3.75rem'
        },
        lineHeights: {
            tight: '1.25',
            normal: '1.5',
            relaxed: '1.75'
        },
        fontWeights: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700'
        }
    },

    // Spacing scale
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem'
    },

    // Border radius
    borderRadius: {
        none: '0',
        sm: '0.125rem',
        base: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px'
    },

    // Shadows
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
    },

    // Z-index scale
    zIndex: {
        base: 1,
        dropdown: 10,
        sticky: 20,
        modal: 30,
        popover: 40,
        tooltip: 50
    }
}

// Component variants
export const componentVariants = {
    // Button variants
    button: {
        primary: 'bg-primary-600 hover:bg-primary-700 text-white border-transparent',
        secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-900 border-secondary-300',
        outline: 'bg-transparent hover:bg-primary-50 text-primary-600 border-primary-600',
        ghost: 'bg-transparent hover:bg-secondary-100 text-secondary-700 border-transparent',
        danger: 'bg-error-600 hover:bg-error-700 text-white border-transparent'
    },

    // Input variants
    input: {
        default: 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500',
        error: 'border-error-300 focus:border-error-500 focus:ring-error-500',
        success: 'border-success-300 focus:border-success-500 focus:ring-success-500'
    },

    // Card variants
    card: {
        default: 'bg-white border-secondary-200 shadow-sm',
        elevated: 'bg-white border-secondary-200 shadow-md',
        interactive: 'bg-white border-secondary-200 shadow-sm hover:shadow-md transition-shadow'
    },

    // Badge variants
    badge: {
        primary: 'bg-primary-100 text-primary-800 border-primary-200',
        secondary: 'bg-secondary-100 text-secondary-800 border-secondary-200',
        success: 'bg-success-100 text-success-800 border-success-200',
        warning: 'bg-warning-100 text-warning-800 border-warning-200',
        error: 'bg-error-100 text-error-800 border-error-200'
    },

    // Status variants
    status: {
        not_started: 'bg-secondary-100 text-secondary-700',
        in_progress: 'bg-warning-100 text-warning-700',
        completed: 'bg-success-100 text-success-700',
        failed: 'bg-error-100 text-error-700'
    }
}

// Animation configurations
export const animations = {
    transitions: {
        fast: 'transition-all duration-150 ease-out',
        normal: 'transition-all duration-300 ease-out',
        slow: 'transition-all duration-500 ease-out'
    },

    transforms: {
        scaleHover: 'hover:scale-105',
        scalePress: 'active:scale-98',
        lift: 'hover:-translate-y-1',
        bounce: 'animate-bounce'
    },

    entrances: {
        fadeIn: 'animate-in fade-in duration-300',
        slideUp: 'animate-in slide-in-from-bottom duration-300',
        slideDown: 'animate-in slide-in-from-top duration-300',
        slideLeft: 'animate-in slide-in-from-right duration-300',
        slideRight: 'animate-in slide-in-from-left duration-300',
        zoomIn: 'animate-in zoom-in duration-200',
        bounceIn: 'animate-in bounce-in duration-500'
    },

    hovers: {
        lift: 'hover-lift transform hover:-translate-y-1 hover:shadow-lg',
        scale: 'transform hover:scale-105 transition-transform duration-200',
        glow: 'hover:shadow-lg hover:shadow-primary-500/25 transition-shadow duration-200',
        subtle: 'hover:bg-secondary-50 transition-colors duration-200'
    },

    loading: {
        spin: 'animate-spin',
        pulse: 'animate-pulse',
        bounce: 'animate-bounce',
        ping: 'animate-ping'
    }
}

// Layout configurations
export const layout = {
    containers: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
        '6xl': 'max-w-6xl',
        full: 'max-w-full'
    },

    grid: {
        cols1: 'grid-cols-1',
        cols2: 'grid-cols-2',
        cols3: 'grid-cols-3',
        cols4: 'grid-cols-4',
        cols6: 'grid-cols-6',
        cols12: 'grid-cols-12'
    }
}

// Utility functions for consistent styling
export const styleUtils = {
    // Combine class names with proper spacing
    cn: (...classes: (string | undefined | null | false)[]): string => {
        return classes.filter(Boolean).join(' ')
    },

    // Get color variant classes
    getColorVariant: (variant: string, type: 'badge' | 'button' | 'status' = 'badge'): string => {
        const variants = componentVariants[type] as Record<string, string>

        // Return the variant if it exists
        if (variant in variants) {
            return variants[variant]
        }

        // Fallback logic based on component type
        if (type === 'badge' || type === 'button') {
            return variants.primary || ''
        } else if (type === 'status') {
            return variants.not_started || ''
        }

        return ''
    },

    // Get responsive classes
    getResponsiveClasses: (base: string, sm?: string, md?: string, lg?: string): string => {
        const classes = [base]
        if (sm) classes.push(`sm:${sm}`)
        if (md) classes.push(`md:${md}`)
        if (lg) classes.push(`lg:${lg}`)
        return classes.join(' ')
    }
}