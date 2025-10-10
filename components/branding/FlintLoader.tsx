'use client';

/**
 * FlintLoader Component
 *
 * Loading animations using the Flint spark icon.
 * Multiple animation variants for different loading contexts.
 *
 * Design Philosophy:
 * - Uses Flint spark icon for brand consistency
 * - Cyan glow effects match design system
 * - Respects prefers-reduced-motion accessibility
 * - Professional yet energetic animations
 */

interface FlintLoaderProps {
  /** Animation variant */
  variant?: 'pulse' | 'spark' | 'spin';
  /** Size: 'sm' for inline, 'md' for cards, 'lg' for full-screen */
  size?: 'sm' | 'md' | 'lg';
  /** Optional text below the loader */
  text?: string;
  /** Custom className for container */
  className?: string;
}

export function FlintLoader({
  variant = 'pulse',
  size = 'md',
  text,
  className = ''
}: FlintLoaderProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      icon: 'w-8 h-8',
      text: 'text-sm',
      gap: 'gap-2',
    },
    md: {
      icon: 'w-12 h-12',
      text: 'text-base',
      gap: 'gap-3',
    },
    lg: {
      icon: 'w-20 h-20',
      text: 'text-lg',
      gap: 'gap-4',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center justify-center ${config.gap} ${className}`}>
      {/* Animated Spark Icon */}
      <div className={`relative ${config.icon}`}>
        {variant === 'pulse' && <PulsingSpark />}
        {variant === 'spark' && <SparkingSpark />}
        {variant === 'spin' && <SpinningSpark />}
      </div>

      {/* Optional loading text */}
      {text && (
        <p className={`${config.text} font-medium text-slate-600 animate-pulse motion-reduce:animate-none`}>
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * PulsingSpark - Gentle pulsing glow effect
 * Best for: Subtle loading states, background processes
 */
function PulsingSpark() {
  return (
    <div className="relative w-full h-full">
      {/* Outer glow ring - pulsing */}
      <div className="absolute inset-0 animate-ping motion-reduce:animate-none opacity-75">
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
          <path
            d="M12 2L6 14h6v8l6-12h-6V2z"
            className="fill-cyan-300"
          />
        </svg>
      </div>

      {/* Main spark - subtle pulse */}
      <div className="relative animate-pulse motion-reduce:animate-none">
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
          {/* Outer glow */}
          <path
            d="M12 2L6 14h6v8l6-12h-6V2z"
            className="fill-cyan-300 opacity-40"
            transform="scale(1.1) translate(-1.2, -1.2)"
          />
          {/* Main body */}
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
  );
}

/**
 * SparkingSpark - Energetic flickering effect
 * Best for: Active processing, AI thinking, generation
 */
function SparkingSpark() {
  return (
    <div className="relative w-full h-full">
      {/* Multiple glow layers for sparking effect */}
      <div className="absolute inset-0 animate-spark-outer motion-reduce:animate-none">
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
          <path
            d="M12 2L6 14h6v8l6-12h-6V2z"
            className="fill-cyan-200 opacity-60"
            transform="scale(1.2) translate(-2, -2)"
          />
        </svg>
      </div>

      <div className="absolute inset-0 animate-spark-middle motion-reduce:animate-none">
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
          <path
            d="M12 2L6 14h6v8l6-12h-6V2z"
            className="fill-cyan-300 opacity-50"
            transform="scale(1.1) translate(-1.2, -1.2)"
          />
        </svg>
      </div>

      {/* Main spark */}
      <div className="relative animate-spark-core motion-reduce:animate-none">
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
          <path
            d="M12 2L6 14h6v8l6-12h-6V2z"
            className="fill-cyan-500"
          />
          <path
            d="M12 2L8 12h4v6l4-8h-4V2z"
            className="fill-cyan-400"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * SpinningSpark - Rotating with glow
 * Best for: Initial load, waiting for connection
 */
function SpinningSpark() {
  return (
    <div className="relative w-full h-full">
      {/* Outer glow - counter-rotating */}
      <div className="absolute inset-0 animate-spin-slow-reverse motion-reduce:animate-none opacity-40">
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
          <path
            d="M12 2L6 14h6v8l6-12h-6V2z"
            className="fill-cyan-300"
            transform="scale(1.15) translate(-1.8, -1.8)"
          />
        </svg>
      </div>

      {/* Main spark - rotating */}
      <div className="relative animate-spin-slow motion-reduce:animate-none">
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
          {/* Outer glow */}
          <path
            d="M12 2L6 14h6v8l6-12h-6V2z"
            className="fill-cyan-300 opacity-40"
            transform="scale(1.1) translate(-1.2, -1.2)"
          />
          {/* Main body */}
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
  );
}

/**
 * FlintLoadingDots - Three animated dots with spark accents
 * Best for: Inline loading, "AI is typing" indicator
 */
export function FlintLoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce motion-reduce:animate-none" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce motion-reduce:animate-none" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce motion-reduce:animate-none" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

/**
 * FlintLoadingBar - Indeterminate progress bar with spark
 * Best for: File uploads, processing tasks
 */
export function FlintLoadingBar({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-1 bg-slate-200 rounded-full overflow-hidden ${className}`}>
      {/* Moving gradient bar */}
      <div className="absolute inset-0 animate-loading-bar motion-reduce:animate-none">
        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      </div>
    </div>
  );
}
