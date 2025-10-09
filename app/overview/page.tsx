'use client';

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32">
          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-20 h-20 border-4 border-blue-500/20 rounded-lg rotate-12"></div>
          <div className="absolute top-40 right-16 w-16 h-16 border-4 border-purple-500/20 rounded-lg -rotate-12"></div>

          <div className="text-center relative z-10">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full mb-8 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-200">Prototype Ready for Scale</span>
            </div>

            <h1 className="text-6xl sm:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 tracking-tight animate-fade-in">
              Agent Orchestrator
            </h1>
            <p className="text-2xl sm:text-3xl font-semibold text-slate-200 mb-6 max-w-3xl mx-auto">
              Bridge the gap between agent development and production deployment
            </p>
            <p className="text-lg text-slate-400 max-w-4xl mx-auto leading-relaxed">
              A Next.js platform that enables BMAD agent builders to leverage the OpenAI API
              and deploy complex, multi-turn agents to end users through an intuitive chat interface.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-16">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/50 transition-all hover:scale-105">
                <div className="text-3xl font-bold text-blue-400">6/8</div>
                <div className="text-sm text-slate-400">Epics Complete</div>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/50 transition-all hover:scale-105">
                <div className="text-3xl font-bold text-purple-400">75%</div>
                <div className="text-sm text-slate-400">Development Progress</div>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-pink-500/50 transition-all hover:scale-105">
                <div className="text-3xl font-bold text-pink-400">10+</div>
                <div className="text-sm text-slate-400">Workflows Supported</div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-12">
              <a
                href="/"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold text-white hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30"
              >
                <span>Try the Live Prototype</span>
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <p className="text-sm text-slate-500 mt-3">
                Experience the full platform with real BMAD agents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Problem & Solution Section with Visual Contrast */}
      <div className="relative py-20 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Problem - with animated border */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl opacity-30 group-hover:opacity-50 transition blur"></div>
              <div className="relative bg-slate-900 border border-red-500/30 rounded-2xl p-8 h-full">
                {/* Icon */}
                <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                <h2 className="text-3xl font-bold text-red-300 mb-6">The Problem</h2>
                <p className="text-slate-200 mb-6 leading-relaxed">
                  Agent builders can create sophisticated BMAD agents in an IDE, but these agents
                  are <span className="text-red-300 font-semibold px-2 py-1 bg-red-500/10 rounded">trapped in the IDE</span>
                </p>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start group/item">
                    <span className="text-red-400 mr-3 text-xl transform group-hover/item:scale-125 transition">✗</span>
                    <span className="group-hover/item:text-white transition">No OpenAI API compatibility testing</span>
                  </li>
                  <li className="flex items-start group/item">
                    <span className="text-red-400 mr-3 text-xl transform group-hover/item:scale-125 transition">✗</span>
                    <span className="group-hover/item:text-white transition">Not accessible to non-technical users</span>
                  </li>
                  <li className="flex items-start group/item">
                    <span className="text-red-400 mr-3 text-xl transform group-hover/item:scale-125 transition">✗</span>
                    <span className="group-hover/item:text-white transition">Can't validate function calling patterns</span>
                  </li>
                  <li className="flex items-start group/item">
                    <span className="text-red-400 mr-3 text-xl transform group-hover/item:scale-125 transition">✗</span>
                    <span className="group-hover/item:text-white transition">No stakeholder feedback loop</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Solution - with animated border */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-30 group-hover:opacity-50 transition blur"></div>
              <div className="relative bg-slate-900 border border-green-500/30 rounded-2xl p-8 h-full">
                {/* Icon */}
                <div className="w-16 h-16 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <h2 className="text-3xl font-bold text-green-300 mb-6">The Solution</h2>
                <p className="text-slate-200 mb-6 leading-relaxed">
                  Agent Orchestrator provides three core capabilities:
                </p>
                <ul className="space-y-4 text-slate-300">
                  <li className="flex items-start group/item">
                    <span className="text-green-400 mr-3 text-xl transform group-hover/item:scale-125 transition flex-shrink-0">✓</span>
                    <div>
                      <span className="font-semibold text-green-300 group-hover/item:text-green-200 transition">OpenAI Compatibility</span>
                      <p className="text-sm text-slate-400 mt-1">
                        BMAD agents work seamlessly with OpenAI's API
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start group/item">
                    <span className="text-green-400 mr-3 text-xl transform group-hover/item:scale-125 transition flex-shrink-0">✓</span>
                    <div>
                      <span className="font-semibold text-green-300 group-hover/item:text-green-200 transition">Simple Deployment</span>
                      <p className="text-sm text-slate-400 mt-1">
                        Upload files → agents immediately functional
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start group/item">
                    <span className="text-green-400 mr-3 text-xl transform group-hover/item:scale-125 transition flex-shrink-0">✓</span>
                    <div>
                      <span className="font-semibold text-green-300 group-hover/item:text-green-200 transition">Familiar Interface</span>
                      <p className="text-sm text-slate-400 mt-1">
                        ChatGPT-style chat everyone knows
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-World Use Case - with visual emphasis */}
      <div className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 group-hover:opacity-30 transition blur-lg"></div>
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/30 rounded-3xl p-10">
              {/* Icon */}
              <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 float-left mr-6">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-blue-300 mb-6">Real-World Use Case: Requirements Gathering</h2>
              <p className="text-slate-200 text-lg leading-relaxed mb-6">
                This prototype includes example agents designed for technical requirements gathering — one of IT's
                most challenging processes. Traditional approaches produce requirements that are
                <span className="text-yellow-300 font-semibold px-2 py-1 bg-yellow-500/10 rounded mx-1">incomplete</span>
                <span className="text-orange-300 font-semibold px-2 py-1 bg-orange-500/10 rounded mx-1">ambiguous</span>
                or <span className="text-red-300 font-semibold px-2 py-1 bg-red-500/10 rounded mx-1">missing context</span>.
                These gaps cascade into poorly-defined stories and production defects.
              </p>
              <div className="bg-slate-950/50 border border-blue-500/20 rounded-xl p-6">
                <p className="text-slate-200 text-lg leading-relaxed">
                  <span className="text-blue-300 font-semibold">Multi-turn BMAD agents</span> address this by combining
                  structured workflows, domain knowledge, and contextual follow-up questions—accelerating requirements
                  gathering while improving quality and reducing defects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits - Interactive Cards */}
      <div className="relative py-20 bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Key Benefits
            </span>
          </h2>
          <p className="text-center text-slate-400 mb-12">Production-ready architecture, optimized for scale</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'Lazy Loading', desc: 'Files loaded only when needed via tool calls', color: 'purple', delay: '0' },
              { icon: '📈', title: 'Scalability', desc: '10+ workflows without pre-loading', color: 'blue', delay: '100' },
              { icon: '🚀', title: 'Performance', desc: 'Fast init, lower context usage', color: 'green', delay: '200' },
              { icon: '⚙️', title: 'Efficiency', desc: 'On-demand resource loading', color: 'orange', delay: '300' }
            ].map((benefit, i) => (
              <div key={i} className="relative group" style={{ animationDelay: `${benefit.delay}ms` }}>
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-${benefit.color}-500 to-${benefit.color}-600 rounded-xl opacity-0 group-hover:opacity-30 transition blur`}></div>
                <div className="relative bg-slate-900 border border-slate-700/50 rounded-xl p-6 h-full hover:border-slate-600 transition-all transform hover:-translate-y-1">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition">{benefit.icon}</div>
                  <h3 className={`text-xl font-bold text-${benefit.color}-300 mb-3`}>{benefit.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Visualization - More Engaging */}
      <div className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Technical Architecture
            </span>
          </h2>
          <p className="text-center text-slate-400 mb-12">Claude Code-like execution pattern with OpenAI</p>

          {/* Execution Flow - Visual Pipeline */}
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-blue-300 mb-8 text-center">Execution Flow</h3>
            <div className="space-y-3">
              {[
                { num: 1, text: 'User message → LLM', color: 'blue', arrow: true },
                { num: 2, text: 'LLM generates tool call', color: 'blue', arrow: true },
                { num: 3, text: '⏸️ Execution PAUSES', color: 'purple', arrow: true, highlight: true },
                { num: 4, text: 'Tool executes → loads file', color: 'blue', arrow: true },
                { num: 5, text: 'Content injected to context', color: 'blue', arrow: true },
                { num: 6, text: 'LLM continues with content', color: 'blue', arrow: true },
                { num: 7, text: '✅ Response to user', color: 'green', arrow: false, highlight: true }
              ].map((step, i) => (
                <div key={i} className="relative">
                  <div className={`flex items-center gap-4 ${step.highlight ? 'transform scale-105' : ''}`}>
                    <div className={`bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-${step.color}-500/50`}>
                      {step.num}
                    </div>
                    <div className={`flex-1 ${step.highlight ? `bg-${step.color}-900/30 border border-${step.color}-500/50` : 'bg-slate-800/50 border border-slate-700/50'} rounded-lg p-4 transition-all hover:scale-[1.02]`}>
                      <span className={`${step.highlight ? `text-${step.color}-200 font-semibold` : 'text-slate-200'}`}>{step.text}</span>
                    </div>
                  </div>
                  {step.arrow && (
                    <div className="flex justify-center my-2">
                      <svg className="w-6 h-6 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(90 12 12)" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Core Components - Visual Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Agentic Execution Loop', desc: 'Pause-load-continue pattern', file: 'lib/agents/agenticLoop.ts', icon: '🔄' },
              { title: 'Path Resolution', desc: 'Dynamic path variables', file: 'lib/pathResolver.ts', icon: '📁' },
              { title: 'Critical Actions', desc: 'Fast agent initialization', file: 'lib/agents/criticalActions.ts', icon: '⚡' },
              { title: 'Bundle System', desc: 'Self-contained packages', file: 'bmad/custom/bundles/', icon: '📦' }
            ].map((comp, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 transition blur"></div>
                <div className="relative bg-slate-900 border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{comp.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-blue-300 mb-2">{comp.title}</h4>
                      <p className="text-slate-300 text-sm mb-3">{comp.desc}</p>
                      <code className="text-xs text-green-400 bg-slate-950 px-2 py-1 rounded">{comp.file}</code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Core Features - Bento Grid Style */}
      <div className="relative py-20 bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
              Core Features
            </span>
          </h2>
          <p className="text-center text-slate-400 mb-12">Built for agent builders and end users</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Agentic Execution Loop', desc: 'Claude Code-like pattern with pause-load-continue', icon: '🔁' },
              { title: 'Lazy File Loading', desc: 'Resources loaded on-demand for optimal performance', icon: '📂' },
              { title: 'Path Variables', desc: 'Portable bundles with {bundle-root}, {core-root}', icon: '🔗' },
              { title: 'Critical Actions', desc: 'Fast agent init with minimal files', icon: '🎯' },
              { title: 'Bundle System', desc: 'Self-contained workflows & templates', icon: '📦' },
              { title: 'ChatGPT Interface', desc: 'Familiar chat UI everyone knows', icon: '💬' }
            ].map((feature, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl opacity-0 group-hover:opacity-50 transition blur"></div>
                <div className="relative bg-slate-900 border border-slate-700/50 rounded-xl p-6 h-full hover:border-blue-500/50 transition-all transform hover:-translate-y-1">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-blue-300 mb-3">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Stack - Icon Grid */}
      <div className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
              Modern Tech Stack
            </span>
          </h2>
          <p className="text-center text-slate-400 mb-12">Production-ready technologies</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Next.js 14', sub: 'App Router', color: 'blue' },
              { name: 'TypeScript', sub: 'Type Safety', color: 'blue' },
              { name: 'OpenAI API', sub: 'GPT-4o-mini', color: 'green' },
              { name: 'React 18', sub: 'Modern UI', color: 'cyan' },
              { name: 'Tailwind CSS', sub: 'Styling', color: 'teal' },
              { name: 'Jest', sub: 'Testing', color: 'red' },
              { name: 'Node.js 18+', sub: 'Runtime', color: 'green' },
              { name: 'YAML', sub: 'Config', color: 'purple' }
            ].map((tech, i) => (
              <div key={i} className="relative group">
                <div className={`absolute -inset-0.5 bg-gradient-to-br from-${tech.color}-500 to-${tech.color}-600 rounded-xl opacity-0 group-hover:opacity-30 transition blur`}></div>
                <div className="relative bg-slate-900 border border-slate-700/50 rounded-xl p-6 text-center hover:border-slate-600 transition-all transform hover:-translate-y-1">
                  <h4 className={`font-bold text-${tech.color}-300 mb-2`}>{tech.name}</h4>
                  <p className="text-slate-400 text-sm">{tech.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap - Timeline Style */}
      <div className="relative py-20 bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              Development Progress
            </span>
          </h2>
          <p className="text-center text-slate-400 mb-12">From prototype to production</p>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-slate-700"></div>

            <div className="space-y-6">
              {[
                { status: 'complete', title: 'Epic 1: Foundation', desc: 'Backend infrastructure & API routes', color: 'green' },
                { status: 'deprecated', title: 'Epic 2: OpenAI Integration', desc: 'Replaced by Epic 4', color: 'slate' },
                { status: 'complete', title: 'Epic 3: Chat Interface', desc: 'ChatGPT-style UI', color: 'green' },
                { status: 'complete', title: 'Epic 4: Agentic Execution', desc: 'Claude Code patterns', color: 'green' },
                { status: 'complete', title: 'Epic 5: File Management', desc: 'Session-based outputs', color: 'green' },
                { status: 'complete', title: 'Epic 6: Enhanced UX', desc: 'Streaming & interactive features', color: 'green' },
                { status: 'current', title: 'Epic 7: Docker Deployment', desc: 'Container packaging', color: 'blue' },
                { status: 'planned', title: 'Epic 8: Polish & Documentation', desc: 'Production hardening', color: 'slate' }
              ].map((epic, i) => (
                <div key={i} className="relative pl-20">
                  {/* Timeline dot */}
                  <div className={`absolute left-6 w-5 h-5 rounded-full border-4 ${
                    epic.status === 'complete' ? 'bg-green-500 border-green-400' :
                    epic.status === 'current' ? 'bg-blue-500 border-blue-400 animate-pulse' :
                    epic.status === 'deprecated' ? 'bg-orange-500/50 border-orange-400/50' :
                    'bg-slate-700 border-slate-600'
                  }`}></div>

                  <div className={`bg-slate-900 border rounded-xl p-6 ${
                    epic.status === 'complete' ? 'border-green-500/30' :
                    epic.status === 'current' ? 'border-blue-500/50' :
                    epic.status === 'deprecated' ? 'border-orange-500/30' :
                    'border-slate-700/50'
                  } hover:border-${epic.color}-500/50 transition-all`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`text-lg font-bold text-${epic.color}-300`}>{epic.title}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        epic.status === 'complete' ? 'bg-green-500/20 text-green-300' :
                        epic.status === 'current' ? 'bg-blue-500/20 text-blue-300' :
                        epic.status === 'deprecated' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {epic.status === 'complete' ? '✓ Complete' :
                         epic.status === 'current' ? '⟳ In Progress' :
                         epic.status === 'deprecated' ? '⚠ Deprecated' :
                         '○ Planned'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">{epic.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Target Users */}
      <div className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-12">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Who Benefits
            </span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-20 group-hover:opacity-30 transition blur-xl"></div>
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/30 rounded-2xl p-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-blue-300 mb-4">Agent Builders</h3>
                <p className="text-slate-200 leading-relaxed">
                  IT professionals—Business Analysts, developers, engineers—who build complex guidance agents.
                  Remove deployment barriers and make agents production-ready instantly.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-30 transition blur-xl"></div>
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-purple-500/30 rounded-2xl p-8">
                <div className="w-16 h-16 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-purple-300 mb-4">End Users</h3>
                <p className="text-slate-200 leading-relaxed">
                  Technical and non-technical staff who need expert assistance through familiar chat interfaces.
                  Access sophisticated AI agents without any technical knowledge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action - Strong Visual */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white/10 rounded-xl rotate-12 animate-float"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-white/10 rounded-xl -rotate-12 animate-float animation-delay-2000"></div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            Ready to Scale
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            This prototype demonstrates a viable path from IDE-based agent development to production deployment.
            The architecture is sound, the use case is proven, and the technology stack is production-ready.
          </p>

          <div className="relative group inline-block">
            <div className="absolute -inset-1 bg-white/30 rounded-2xl blur group-hover:bg-white/40 transition"></div>
            <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-2xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <svg className="w-8 h-8 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <h3 className="text-3xl font-bold text-white">What's Next</h3>
                <svg className="w-8 h-8 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <p className="text-white/90 text-lg leading-relaxed">
                With investment in long-term development, Agent Orchestrator can become the
                <span className="font-bold text-yellow-300"> standard platform </span>
                for deploying BMAD agents across the organization—enabling teams to build and share sophisticated
                AI agents that improve processes, reduce errors, and accelerate critical workflows.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-slate-500 text-sm">
            Built with Next.js 14, TypeScript, React 18, Tailwind CSS, and OpenAI API
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-20px) rotate(12deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}
