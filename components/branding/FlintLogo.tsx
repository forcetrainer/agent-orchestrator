'use client';

/**
 * FlintLogo Component
 *
 * Branded logo for the Flint application.
 * "Flint" represents the foundation for generating the spark that ignites agents.
 *
 * Design Philosophy:
 * - Clean, professional typography
 * - Spark visual element using CSS geometric shapes
 * - Matches deep blue + cyan design system
 * - Responsive sizing for different contexts
 */

interface FlintLogoProps {
  /** Size variant: 'sm' for compact areas, 'md' for headers, 'lg' for hero sections */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the tagline */
  showTagline?: boolean;
  /** Custom className for additional styling */
  className?: string;
}

export function FlintLogo({ size = 'md', showTagline = false, className = '' }: FlintLogoProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'gap-2',
      wordmark: 'text-xl',
      tagline: 'text-xs',
      sparkSize: 'w-6 h-6',
    },
    md: {
      container: 'gap-3',
      wordmark: 'text-2xl',
      tagline: 'text-sm',
      sparkSize: 'w-8 h-8',
    },
    lg: {
      container: 'gap-4',
      wordmark: 'text-4xl',
      tagline: 'text-base',
      sparkSize: 'w-12 h-12',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.container} ${className}`}>
      {/* Spark Icon - Geometric CSS shape */}
      <div className={`relative ${config.sparkSize} flex-shrink-0`}>
        {/* Main spark - cyan gradient triangle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
            {/* Outer glow */}
            <path
              d="M12 2L6 14h6v8l6-12h-6V2z"
              className="fill-cyan-300 opacity-40"
              transform="scale(1.1) translate(-1.2, -1.2)"
            />
            {/* Main spark body */}
            <path
              d="M12 2L6 14h6v8l6-12h-6V2z"
              className="fill-cyan-500"
            />
            {/* Inner highlight */}
            <path
              d="M12 2L8 12h4v6l4-8h-4V2z"
              className="fill-cyan-400"
            />
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <h1 className={`${config.wordmark} font-bold text-slate-900 leading-none tracking-tight`}>
          Flint
        </h1>
        {showTagline && (
          <p className={`${config.tagline} text-slate-600 font-medium tracking-wide`}>
            Agent Orchestration
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * FlintLogoCompact - Minimal version for tight spaces
 * Shows just the spark icon with tooltip
 */
export function FlintLogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`w-8 h-8 relative group ${className}`} title="Flint - Agent Orchestration">
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
        <path
          d="M12 2L6 14h6v8l6-12h-6V2z"
          className="fill-cyan-500 group-hover:fill-cyan-600 transition-colors duration-200"
        />
        <path
          d="M12 2L8 12h4v6l4-8h-4V2z"
          className="fill-cyan-400"
        />
      </svg>
    </div>
  );
}
