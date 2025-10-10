'use client';

import { useState } from 'react';
import { FlintLogo, FlintLogoCompact } from '@/components/branding/FlintLogo';
import { FlintLoader, FlintLoadingDots, FlintLoadingBar } from '@/components/branding/FlintLoader';
import { FlintLoadingScreen, FlintLoadingScreenCompact, FlintSplashScreen } from '@/components/branding/FlintLoadingScreen';

/**
 * Branding Demo Page
 *
 * Showcases all Flint branding components and loading animations.
 * Navigate to /branding-demo to view this page.
 *
 * Purpose: Visual testing and brand review for stakeholders
 */
export default function BrandingDemo() {
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate progress
  const simulateProgress = () => {
    setLoadingProgress(0);
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <>
      {/* Full-screen loading overlays */}
      {showLoadingScreen && (
        <FlintLoadingScreen
          message="Loading Flint"
          subMessage="Initializing agent orchestration..."
          variant="spark"
          overlay
          showProgress
          progress={loadingProgress}
        />
      )}

      {showSplashScreen && (
        <FlintSplashScreen
          message="Igniting the spark..."
        />
      )}

      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Flint Branding</h1>
            <p className="text-slate-600">Visual identity and loading animations</p>
          </div>

        {/* Logo Variants */}
        <section className="bg-white rounded-lg p-8 border-l-4 border-blue-800 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-cyan-500 pl-3">
            Logo Variants
          </h2>

          <div className="space-y-8">
            {/* Small Logo */}
            <div className="flex items-center gap-8 pb-6 border-b border-slate-200">
              <div className="w-48 text-sm font-medium text-slate-600">Small (sm)</div>
              <FlintLogo size="sm" />
            </div>

            {/* Medium Logo */}
            <div className="flex items-center gap-8 pb-6 border-b border-slate-200">
              <div className="w-48 text-sm font-medium text-slate-600">Medium (md) - Default</div>
              <FlintLogo size="md" />
            </div>

            {/* Large Logo */}
            <div className="flex items-center gap-8 pb-6 border-b border-slate-200">
              <div className="w-48 text-sm font-medium text-slate-600">Large (lg)</div>
              <FlintLogo size="lg" />
            </div>

            {/* With Tagline */}
            <div className="flex items-center gap-8 pb-6 border-b border-slate-200">
              <div className="w-48 text-sm font-medium text-slate-600">With Tagline</div>
              <FlintLogo size="md" showTagline />
            </div>

            {/* Compact Icon */}
            <div className="flex items-center gap-8">
              <div className="w-48 text-sm font-medium text-slate-600">Compact (Icon Only)</div>
              <FlintLogoCompact />
            </div>
          </div>
        </section>

        {/* Loading Animations */}
        <section className="bg-white rounded-lg p-8 border-l-4 border-blue-800 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-cyan-500 pl-3">
            Loading Animations
          </h2>

          <div className="space-y-8">
            {/* Pulse Animation */}
            <div className="pb-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Pulse Animation</h3>
              <p className="text-sm text-slate-600 mb-4">Gentle pulsing glow - Best for subtle loading states</p>
              <div className="flex items-center gap-12">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Small</p>
                  <FlintLoader variant="pulse" size="sm" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Medium</p>
                  <FlintLoader variant="pulse" size="md" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Large</p>
                  <FlintLoader variant="pulse" size="lg" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">With Text</p>
                  <FlintLoader variant="pulse" size="md" text="Loading..." />
                </div>
              </div>
            </div>

            {/* Spark Animation */}
            <div className="pb-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Spark Animation</h3>
              <p className="text-sm text-slate-600 mb-4">Energetic flickering - Best for AI thinking/generation</p>
              <div className="flex items-center gap-12">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Small</p>
                  <FlintLoader variant="spark" size="sm" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Medium</p>
                  <FlintLoader variant="spark" size="md" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Large</p>
                  <FlintLoader variant="spark" size="lg" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">With Text</p>
                  <FlintLoader variant="spark" size="md" text="Agent is thinking..." />
                </div>
              </div>
            </div>

            {/* Spin Animation */}
            <div className="pb-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Spin Animation</h3>
              <p className="text-sm text-slate-600 mb-4">Rotating with glow - Best for initial load/connection</p>
              <div className="flex items-center gap-12">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Small</p>
                  <FlintLoader variant="spin" size="sm" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Medium</p>
                  <FlintLoader variant="spin" size="md" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Large</p>
                  <FlintLoader variant="spin" size="lg" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">With Text</p>
                  <FlintLoader variant="spin" size="md" text="Connecting..." />
                </div>
              </div>
            </div>

            {/* Loading Dots */}
            <div className="pb-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Loading Dots</h3>
              <p className="text-sm text-slate-600 mb-4">Three bouncing dots - Best for inline loading</p>
              <div className="flex items-center gap-8">
                <FlintLoadingDots />
                <div className="flex items-center gap-3 bg-slate-100 px-4 py-3 rounded-xl border-l-4 border-cyan-500">
                  <FlintLoadingDots />
                  <span className="text-slate-700">Agent is typing...</span>
                </div>
              </div>
            </div>

            {/* Loading Bar */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Loading Bar</h3>
              <p className="text-sm text-slate-600 mb-4">Indeterminate progress - Best for file uploads/processing</p>
              <div className="space-y-4">
                <FlintLoadingBar className="w-full" />
                <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-700 mb-2">Processing files...</p>
                  <FlintLoadingBar />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="bg-white rounded-lg p-8 border-l-4 border-blue-800 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-cyan-500 pl-3">
            Usage Examples
          </h2>

          <div className="space-y-6">
            {/* Header Example */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Header Bar</h3>
              <div className="border-b border-slate-200 bg-white px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                  <FlintLogo size="sm" />
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="flex-1 text-sm text-slate-700">Content area</div>
                </div>
              </div>
            </div>

            {/* Loading State in Chat */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Chat Loading Indicator</h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="max-w-[75%] mr-auto bg-slate-100 text-slate-900 px-4 py-3 rounded-xl border-l-4 border-cyan-500">
                  <div className="flex items-center gap-3">
                    <FlintLoadingDots />
                    <span className="text-slate-700">Agent is thinking...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-screen Loading */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Full-Screen Loading</h3>
              <div className="bg-slate-50 p-12 rounded-lg flex items-center justify-center">
                <FlintLoader variant="spark" size="lg" text="Initializing Flint..." />
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="bg-white rounded-lg p-8 border-l-4 border-blue-800 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-cyan-500 pl-3">
            Brand Colors
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Primary Colors */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Primary (Deep Ocean Blue)</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-blue-800 rounded-lg shadow-sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">blue-800</p>
                    <p className="text-xs text-slate-600">#1E40AF</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Accent Colors */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Accent (Vibrant Cyan)</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-cyan-500 rounded-lg shadow-sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">cyan-500</p>
                    <p className="text-xs text-slate-600">#06B6D4</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Loading Screens */}
        <section className="bg-white rounded-lg p-8 border-l-4 border-blue-800 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-cyan-500 pl-3">
            Loading Screens
          </h2>

          <div className="space-y-8">
            {/* Full Loading Screen */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Full Loading Screen</h3>
              <p className="text-sm text-slate-600 mb-4">
                Beautiful full-screen loading experience with Flint branding, animated background, and optional progress tracking.
              </p>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => {
                    setShowLoadingScreen(true);
                    simulateProgress();
                    setTimeout(() => setShowLoadingScreen(false), 4000);
                  }}
                  className="px-6 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Show Loading Screen
                </button>
              </div>
            </div>

            {/* Splash Screen */}
            <div className="pb-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Splash Screen</h3>
              <p className="text-sm text-slate-600 mb-4">
                Dramatic hero-style loading screen for app initialization. Dark theme with glowing spark icon.
              </p>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => {
                    setShowSplashScreen(true);
                    setTimeout(() => setShowSplashScreen(false), 4000);
                  }}
                  className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 hover:shadow-md focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Show Splash Screen
                </button>
              </div>
            </div>

            {/* Compact Loading */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Compact Loading</h3>
              <p className="text-sm text-slate-600 mb-4">
                Smaller loading component for inline contexts, modals, or cards.
              </p>
              <div className="bg-slate-50 rounded-lg border border-slate-200">
                <FlintLoadingScreenCompact message="Loading content..." variant="pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* Back to App */}
        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200"
          >
            ← Back to Flint
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
