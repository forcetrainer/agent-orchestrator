'use client';

import { FlintLogo } from './FlintLogo';
import { FlintLoader, FlintLoadingBar } from './FlintLoader';

/**
 * FlintLoadingScreen Component
 *
 * Full-screen branded loading experience for Flint.
 * Beautiful, professional loading screen with animations.
 *
 * Use Cases:
 * - Initial app load
 * - Agent initialization
 * - Major state transitions
 * - Reconnecting to server
 *
 * Design Philosophy:
 * - Centered, minimal design
 * - Prominent Flint branding
 * - Smooth animations with accessibility support
 * - Optional progress indication
 */

export interface FlintLoadingScreenProps {
  /** Loading message to display */
  message?: string;
  /** Sub-message for additional context */
  subMessage?: string;
  /** Show progress bar (for determinate loading) */
  showProgress?: boolean;
  /** Progress percentage (0-100) if determinate */
  progress?: number;
  /** Animation variant for the loader */
  variant?: 'pulse' | 'spark' | 'spin';
  /** Overlay mode - appears over content vs full screen */
  overlay?: boolean;
}

export function FlintLoadingScreen({
  message = 'Loading Flint',
  subMessage,
  showProgress = false,
  progress,
  variant = 'spark',
  overlay = false,
}: FlintLoadingScreenProps) {
  return (
    <div
      className={`
        ${overlay ? 'fixed' : 'relative'}
        inset-0 z-50
        flex items-center justify-center
        bg-gradient-to-br from-slate-50 via-white to-cyan-50
        ${overlay ? 'backdrop-blur-sm bg-opacity-95' : ''}
      `}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle radial gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse motion-reduce:animate-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse motion-reduce:animate-none" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse motion-reduce:animate-none" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content card */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-8 py-12 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/50 max-w-md w-full mx-4">
        {/* Flint Logo */}
        <div className="animate-fade-in-up motion-reduce:animate-none">
          <FlintLogo size="lg" showTagline />
        </div>

        {/* Divider */}
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full" />

        {/* Animated Loader */}
        <div className="animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: '200ms' }}>
          <FlintLoader variant={variant} size="lg" />
        </div>

        {/* Loading Message */}
        <div className="text-center space-y-2 animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: '400ms' }}>
          <p className="text-xl font-semibold text-slate-900">
            {message}
          </p>
          {subMessage && (
            <p className="text-sm text-slate-600">
              {subMessage}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full space-y-2 animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: '600ms' }}>
            {progress !== undefined ? (
              // Determinate progress
              <>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <p className="text-xs text-center text-slate-500 font-medium">
                  {Math.round(progress)}%
                </p>
              </>
            ) : (
              // Indeterminate progress
              <FlintLoadingBar />
            )}
          </div>
        )}
      </div>

      {/* Floating particles effect (optional decorative element) - Simplified for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float motion-reduce:animate-none" style={{ left: '20%', top: '10%', animationDelay: '0s' }} />
        <div className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float motion-reduce:animate-none" style={{ left: '80%', top: '20%', animationDelay: '1s' }} />
        <div className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float motion-reduce:animate-none" style={{ left: '50%', top: '60%', animationDelay: '2s' }} />
        <div className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float motion-reduce:animate-none" style={{ left: '30%', top: '80%', animationDelay: '3s' }} />
        <div className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float motion-reduce:animate-none" style={{ left: '70%', top: '50%', animationDelay: '4s' }} />
      </div>
    </div>
  );
}

/**
 * FlintLoadingScreenCompact - Smaller version for inline contexts
 * Best for: Modal loading, section loading, card loading
 */
export function FlintLoadingScreenCompact({
  message = 'Loading',
  variant = 'pulse',
}: {
  message?: string;
  variant?: 'pulse' | 'spark' | 'spin';
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-12 px-6"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <FlintLoader variant={variant} size="md" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}

/**
 * FlintSplashScreen - Hero-style loading for app initialization
 * Full viewport, dramatic entrance, perfect for first load
 */
export function FlintSplashScreen({
  message = 'Igniting the spark',
  onLoadComplete,
}: {
  message?: string;
  onLoadComplete?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-cyan-900">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-grid-pattern animate-pulse motion-reduce:animate-none" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-8 animate-fade-in motion-reduce:animate-none">
        {/* Large logo with glow */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-3xl opacity-50">
            <div className="w-32 h-32 mx-auto bg-cyan-400 rounded-full" />
          </div>

          {/* Logo */}
          <div className="relative">
            <svg viewBox="0 0 120 120" className="w-32 h-32 mx-auto" fill="none">
              {/* Outer glow layers */}
              <path
                d="M60 10L30 70h30v40l30-60H60V10z"
                className="fill-cyan-300 opacity-40 animate-pulse motion-reduce:animate-none"
                transform="scale(1.2) translate(-12, -12)"
              />
              <path
                d="M60 10L30 70h30v40l30-60H60V10z"
                className="fill-cyan-400 opacity-60 animate-pulse motion-reduce:animate-none"
                transform="scale(1.1) translate(-6, -6)"
                style={{ animationDelay: '0.5s' }}
              />
              {/* Main spark */}
              <path
                d="M60 10L30 70h30v40l30-60H60V10z"
                className="fill-cyan-500"
              />
              <path
                d="M60 10L40 60h20v30l20-40H60V10z"
                className="fill-cyan-300"
              />
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-white tracking-tight">
            Flint
          </h1>
          <p className="text-cyan-300 text-lg font-medium tracking-wide">
            Agent Orchestration
          </p>
        </div>

        {/* Loading indicator */}
        <div className="pt-4">
          <p className="text-white/80 text-sm mb-4">{message}</p>
          <FlintLoadingBar className="w-64 mx-auto" />
        </div>
      </div>
    </div>
  );
}
