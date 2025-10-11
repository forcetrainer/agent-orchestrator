'use client';

import { FlintLogo } from '@/components/branding/FlintLogo';

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <FlintLogo size="sm" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-800 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full mb-6">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-cyan-200">Prototype Ready for Scale</span>
            </div>

            <div className="flex justify-center mb-6">
              <FlintLogo size="lg" showTagline={false} />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold mb-4 text-cyan-100">
              The foundation that generates the spark to ignite your agents
            </p>
            <p className="text-lg text-blue-100 max-w-3xl mx-auto leading-relaxed">
              A Next.js platform that enables BMAD agent builders to leverage the OpenAI API
              and deploy complex, multi-turn agents to end users through an intuitive chat interface.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-12">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="text-3xl font-bold text-cyan-400">6/8</div>
                <div className="text-sm text-blue-100">Epics Complete</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="text-3xl font-bold text-cyan-400">75%</div>
                <div className="text-sm text-blue-100">Development Progress</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="text-3xl font-bold text-cyan-400">10+</div>
                <div className="text-sm text-blue-100">Workflows Supported</div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-12">
              <a
                href="/"
                className="inline-flex items-center gap-3 px-8 py-4 bg-cyan-500 rounded-xl font-semibold text-blue-900 hover:bg-cyan-400 transition-all transform hover:scale-105 shadow-lg"
              >
                <span>Try the Live Prototype</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <p className="text-sm text-blue-200 mt-3">
                Experience the full platform with real BMAD agents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Problem & Solution Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Problem */}
            <div className="bg-white border border-slate-200 rounded-xl p-8 border-l-4 border-l-red-500">
              <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-4">The Problem</h2>
              <p className="text-slate-700 mb-4 leading-relaxed">
                Agent builders can create sophisticated BMAD agents in an IDE, but these agents
                are <span className="font-semibold text-red-600">trapped in the IDE</span>
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>No OpenAI API compatibility testing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Not accessible to non-technical users</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Can't validate function calling patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>No stakeholder feedback loop</span>
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-white border border-slate-200 rounded-xl p-8 border-l-4 border-l-cyan-500">
              <div className="w-16 h-16 bg-cyan-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-4">The Solution</h2>
              <p className="text-slate-700 mb-4 leading-relaxed">
                Flint provides three core capabilities:
              </p>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start">
                  <span className="text-cyan-600 mr-2 flex-shrink-0">✓</span>
                  <div>
                    <span className="font-semibold text-blue-800">OpenAI Compatibility</span>
                    <p className="text-sm text-slate-600 mt-1">
                      BMAD agents work seamlessly with OpenAI's API
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-600 mr-2 flex-shrink-0">✓</span>
                  <div>
                    <span className="font-semibold text-blue-800">Simple Deployment</span>
                    <p className="text-sm text-slate-600 mt-1">
                      Upload files → agents immediately functional
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-600 mr-2 flex-shrink-0">✓</span>
                  <div>
                    <span className="font-semibold text-blue-800">Familiar Interface</span>
                    <p className="text-sm text-slate-600 mt-1">
                      ChatGPT-style chat everyone knows
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Real-World Use Case */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white border border-slate-200 rounded-xl p-8 border-l-4 border-l-blue-800">
            <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-6 float-left mr-6">
              <svg className="w-8 h-8 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-blue-800 mb-4 border-l-4 border-cyan-500 pl-3">
              Real-World Use Case: Requirements Gathering
            </h2>
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              This prototype includes example agents designed for technical requirements gathering — one of IT's
              most challenging processes. Traditional approaches produce requirements that are
              <span className="font-semibold text-yellow-600 px-1">incomplete</span>,
              <span className="font-semibold text-orange-600 px-1">ambiguous</span>, or
              <span className="font-semibold text-red-600 px-1">missing context</span>.
              These gaps cascade into poorly-defined stories and production defects.
            </p>
            <div className="bg-blue-50 border-l-4 border-cyan-500 rounded-lg p-6">
              <p className="text-slate-700 leading-relaxed">
                <span className="text-blue-800 font-semibold">Multi-turn BMAD agents</span> address this by combining
                structured workflows, domain knowledge, and contextual follow-up questions—accelerating requirements
                gathering while improving quality and reducing defects.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-3 text-blue-800 border-l-4 border-cyan-500 pl-0 inline-block">
            Key Benefits
          </h2>
          <p className="text-center text-slate-600 mb-10">Production-ready architecture, optimized for scale</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'Lazy Loading', desc: 'Files loaded only when needed via tool calls', color: 'cyan' },
              { icon: '📈', title: 'Scalability', desc: '10+ workflows without pre-loading', color: 'blue' },
              { icon: '🚀', title: 'Performance', desc: 'Fast init, lower context usage', color: 'cyan' },
              { icon: '⚙️', title: 'Efficiency', desc: 'On-demand resource loading', color: 'blue' }
            ].map((benefit, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-blue-800 mb-3">{benefit.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Visualization */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-3 text-blue-800">
            Technical Architecture
          </h2>
          <p className="text-center text-slate-600 mb-10">Claude Code-like execution pattern with OpenAI</p>

          {/* Execution Flow */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 mb-8 border-l-4 border-l-blue-800">
            <h3 className="text-2xl font-bold text-blue-800 mb-6 border-l-4 border-cyan-500 pl-3">Execution Flow</h3>
            <div className="space-y-3">
              {[
                { num: 1, text: 'User message → LLM', color: 'blue', arrow: true },
                { num: 2, text: 'LLM generates tool call', color: 'blue', arrow: true },
                { num: 3, text: '⏸️ Execution PAUSES', color: 'cyan', arrow: true, highlight: true },
                { num: 4, text: 'Tool executes → loads file', color: 'blue', arrow: true },
                { num: 5, text: 'Content injected to context', color: 'blue', arrow: true },
                { num: 6, text: 'LLM continues with content', color: 'blue', arrow: true },
                { num: 7, text: '✅ Response to user', color: 'cyan', arrow: false, highlight: true }
              ].map((step, i) => (
                <div key={i}>
                  <div className={`flex items-center gap-4 ${step.highlight ? 'bg-cyan-50 rounded-lg p-3' : ''}`}>
                    <div className={`${step.color === 'cyan' ? 'bg-cyan-500' : 'bg-blue-800'} text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0`}>
                      {step.num}
                    </div>
                    <div className={`flex-1 ${step.highlight ? 'border-l-4 border-cyan-500 pl-4' : ''}`}>
                      <span className={`${step.highlight ? 'font-semibold text-blue-800' : 'text-slate-700'}`}>{step.text}</span>
                    </div>
                  </div>
                  {step.arrow && (
                    <div className="flex justify-center my-2">
                      <svg className="w-6 h-6 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(90 12 12)" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Core Components */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Agentic Execution Loop', desc: 'Pause-load-continue pattern', file: 'lib/agents/agenticLoop.ts', icon: '🔄' },
              { title: 'Path Resolution', desc: 'Dynamic path variables', file: 'lib/pathResolver.ts', icon: '📁' },
              { title: 'Critical Actions', desc: 'Fast agent initialization', file: 'lib/agents/criticalActions.ts', icon: '⚡' },
              { title: 'Bundle System', desc: 'Self-contained packages', file: 'bmad/custom/bundles/', icon: '📦' }
            ].map((comp, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{comp.icon}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-blue-800 mb-2">{comp.title}</h4>
                    <p className="text-slate-700 text-sm mb-3">{comp.desc}</p>
                    <code className="text-xs text-cyan-700 bg-cyan-50 px-2 py-1 rounded border-l-4 border-cyan-500">{comp.file}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Core Features */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-3 text-blue-800">
            Core Features
          </h2>
          <p className="text-center text-slate-600 mb-10">Built for agent builders and end users</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Agentic Execution Loop', desc: 'Claude Code-like pattern with pause-load-continue', icon: '🔁' },
              { title: 'Lazy File Loading', desc: 'Resources loaded on-demand for optimal performance', icon: '📂' },
              { title: 'Path Variables', desc: 'Portable bundles with {bundle-root}, {core-root}', icon: '🔗' },
              { title: 'Critical Actions', desc: 'Fast agent init with minimal files', icon: '🎯' },
              { title: 'Bundle System', desc: 'Self-contained workflows & templates', icon: '📦' },
              { title: 'Flint Design System', desc: 'Distinctive cyan spark branding', icon: '💬' }
            ].map((feature, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-blue-800 mb-3">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-3 text-blue-800">
            Modern Tech Stack
          </h2>
          <p className="text-center text-slate-600 mb-10">Production-ready technologies</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Next.js 14', sub: 'App Router' },
              { name: 'TypeScript', sub: 'Type Safety' },
              { name: 'OpenAI API', sub: 'GPT-4o-mini' },
              { name: 'React 18', sub: 'Modern UI' },
              { name: 'Tailwind CSS', sub: 'Styling' },
              { name: 'Jest', sub: 'Testing' },
              { name: 'Node.js 18+', sub: 'Runtime' },
              { name: 'YAML', sub: 'Config' }
            ].map((tech, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 text-center border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-blue-800 mb-2">{tech.name}</h4>
                <p className="text-slate-600 text-sm">{tech.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-3 text-blue-800">
            Development Progress
          </h2>
          <p className="text-center text-slate-600 mb-10">From prototype to production</p>

          <div className="space-y-6">
            {[
              { status: 'complete', title: 'Epic 1: Foundation', desc: 'Backend infrastructure & API routes' },
              { status: 'deprecated', title: 'Epic 2: OpenAI Integration', desc: 'Replaced by Epic 4' },
              { status: 'complete', title: 'Epic 3: Chat Interface', desc: 'ChatGPT-style UI' },
              { status: 'complete', title: 'Epic 4: Agentic Execution', desc: 'Claude Code patterns' },
              { status: 'complete', title: 'Epic 5: File Management', desc: 'Session-based outputs' },
              { status: 'complete', title: 'Epic 6: Enhanced UX', desc: 'Streaming & interactive features' },
              { status: 'current', title: 'Epic 7: Docker Deployment', desc: 'Container packaging' },
              { status: 'planned', title: 'Epic 8: Polish & Documentation', desc: 'Production hardening' }
            ].map((epic, i) => (
              <div key={i} className={`bg-white border rounded-xl p-6 border-l-4 ${
                epic.status === 'complete' ? 'border-l-cyan-500' :
                epic.status === 'current' ? 'border-l-blue-800' :
                epic.status === 'deprecated' ? 'border-l-orange-400' :
                'border-l-slate-300'
              } ${epic.status === 'complete' ? 'border-slate-200' : epic.status === 'current' ? 'border-blue-200 shadow-md' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`text-lg font-bold ${
                    epic.status === 'complete' ? 'text-cyan-700' :
                    epic.status === 'current' ? 'text-blue-800' :
                    epic.status === 'deprecated' ? 'text-orange-600' :
                    'text-slate-600'
                  }`}>{epic.title}</h3>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    epic.status === 'complete' ? 'bg-cyan-50 text-cyan-700' :
                    epic.status === 'current' ? 'bg-blue-100 text-blue-800' :
                    epic.status === 'deprecated' ? 'bg-orange-50 text-orange-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {epic.status === 'complete' ? '✓ Complete' :
                     epic.status === 'current' ? '⟳ In Progress' :
                     epic.status === 'deprecated' ? '⚠ Deprecated' :
                     '○ Planned'}
                  </span>
                </div>
                <p className="text-slate-600 text-sm">{epic.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Users */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-10 text-blue-800">
            Who Benefits
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl p-8 border-l-4 border-l-blue-800">
              <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-blue-800 mb-4 border-l-4 border-cyan-500 pl-3">Agent Builders</h3>
              <p className="text-slate-700 leading-relaxed">
                IT professionals—Business Analysts, developers, engineers—who build complex guidance agents.
                Remove deployment barriers and make agents production-ready instantly.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 border-l-4 border-l-cyan-500">
              <div className="w-16 h-16 bg-cyan-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-cyan-700 mb-4 border-l-4 border-blue-800 pl-3">End Users</h3>
              <p className="text-slate-700 leading-relaxed">
                Technical and non-technical staff who need expert assistance through familiar chat interfaces.
                Access sophisticated AI agents without any technical knowledge.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-24 bg-gradient-to-br from-blue-800 to-blue-900 text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Scale
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            This prototype demonstrates a viable path from IDE-based agent development to production deployment.
            The architecture is sound, the use case is proven, and the technology stack is production-ready.
          </p>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <svg className="w-8 h-8 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <h3 className="text-3xl font-bold">What's Next</h3>
              <svg className="w-8 h-8 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="text-white/90 text-lg leading-relaxed">
              With investment in long-term development, Flint can become the
              <span className="font-bold text-cyan-400"> standard platform </span>
              for deploying BMAD agents across the organization—enabling teams to build and share sophisticated
              AI agents that improve processes, reduce errors, and accelerate critical workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Built with BMAD Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-br from-blue-800 to-blue-900 text-white rounded-xl p-8 border-l-4 border-l-cyan-500">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <span>Built with BMAD™</span>
              <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </h2>

            <p className="text-blue-100 mb-6 leading-relaxed">
              This project is built to support agents created with the{' '}
              <a
                href="https://github.com/bmad-code-org/BMAD-METHOD"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 font-semibold hover:text-cyan-300 underline"
              >
                BMAD-METHOD™
              </a>
              , a universal AI agent framework for "Agentic Agile Driven Development."
            </p>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-6">
              <p className="text-white leading-relaxed">
                Flint provides a deployment platform for BMAD agents, enabling them to work seamlessly with OpenAI's API
                and making them accessible to end users through an intuitive chat interface. While Flint is specifically
                designed for BMAD agents, the underlying architecture can support other agent frameworks with similar
                file-based instruction patterns.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <a
                href="https://github.com/bmad-code-org/BMAD-METHOD"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-blue-900 rounded-lg font-semibold hover:bg-cyan-400 transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span>View BMAD on GitHub</span>
              </a>
              <p className="text-blue-200 text-sm">
                ⭐ Star both repositories to help others discover them!
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-xs text-blue-200">
                BMAD™ and BMAD-METHOD™ are trademarks of BMad Code, LLC.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* License Section */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white border border-slate-200 rounded-xl p-8 border-l-4 border-l-blue-800">
            <h2 className="text-3xl font-bold text-blue-800 mb-6 border-l-4 border-cyan-500 pl-3">
              License
            </h2>

            <p className="text-slate-700 mb-6 leading-relaxed">
              This project is licensed under the <span className="font-semibold">Flint Non-Commercial License</span>.
              See the{' '}
              <a
                href="https://github.com/forcetrainer/agent-orchestrator/blob/main/LICENSE"
                className="text-blue-800 font-semibold hover:text-cyan-600 underline"
              >
                LICENSE
              </a>
              {' '}file for details.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Allowed */}
              <div className="bg-cyan-50 border-l-4 border-cyan-500 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Allowed</span>
                </h3>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">✓</span>
                    <span>Personal projects</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">✓</span>
                    <span>Education & research</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">✓</span>
                    <span>Internal corporate use</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">✓</span>
                    <span>Modify & redistribute (with attribution)</span>
                  </li>
                </ul>
              </div>

              {/* Prohibited */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Prohibited</span>
                </h3>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">✗</span>
                    <span>Commercial products/services</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">✗</span>
                    <span>Charging fees or subscriptions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">✗</span>
                    <span>Monetization (ads, licensing, etc.)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">✗</span>
                    <span>Commercial software bundles</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Commercial Licensing</span>
              </h3>
              <p className="text-slate-700">
                Interested in using Flint for commercial purposes? Commercial licensing is available upon request.
                Please open an issue on GitHub to inquire about commercial licensing options.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-slate-600 text-sm mb-2">
              Built with Next.js 14, TypeScript, React 18, Tailwind CSS, and OpenAI API
            </p>
            <p className="text-slate-500 text-xs">
              Flint Non-Commercial License • Copyright © 2025 Bryan Inagaki
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
