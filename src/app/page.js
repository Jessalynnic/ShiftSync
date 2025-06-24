"use client";
import { useState } from 'react';

export default function LandingPage() {
  // SVG logo symbol for ShiftSync
  const LogoSymbol = (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="16" fill="#38bdf8" />
      <path d="M11 18a7 7 0 0 1 7-7c2.5 0 4.7 1.36 5.89 3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M25 18a7 7 0 0 1-7 7c-2.5 0-4.7-1.36-5.89-3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="18" cy="18" r="3" fill="#fff" />
    </svg>
  );

  // FAQ data
  const faqs = [
    {
      q: 'What is ShiftSync?',
      a: 'ShiftSync is a modern workforce management platform for small businesses, making scheduling, shift swaps, and employee management effortless.'
    },
    {
      q: 'Is ShiftSync free for small teams?',
      a: 'Yes! ShiftSync is 100% free for small teams. Larger teams can try all features with a free trial.'
    },
    {
      q: 'Can employees request shifts or time off?',
      a: 'Absolutely. Employees can request shifts, swap, and submit time-off requests directly in the app.'
    },
    {
      q: 'Does ShiftSync integrate with payroll or other tools?',
      a: 'Yes, ShiftSync integrates with popular payroll and productivity tools. See our integrations section for more.'
    },
    {
      q: 'Is my business data secure?',
      a: 'Your data is encrypted and protected with industry best practices.'
    },
  ];
  const [openFaq, setOpenFaq] = useState(null);

  // Feature highlights data
  const features = [
    {
      title: 'Create schedules in minutes',
      desc: 'Schedule fast with templates, auto-conflict checks, and role-based availability',
      points: [
        'Availability & role-based auto-scheduling',
        'Templates & shift duplication',
        'Drag & drop',
        'Claimable open shifts',
        'Multi-location scheduling',
        'Live schedule sharing link',
      ],
      icon: '🗓️',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Boost employee accountability',
      desc: 'Let employees claim, swap, or request shifts and time off—no confusion, no chaos.',
      points: [
        'Shift accept/reject',
        'Proof of work uploads',
        'Clock-in tracking',
        'Push notifications',
        'Tasks & shift reminders',
        'Shift confirmations',
      ],
      icon: '✅',
      image: '/images/shift_swap.png',
      imageAlt: 'Hands exchanging shift cards',
    },
    {
      title: 'Comply with confidence',
      desc: 'Stay compliant with labor laws, overtime limits, and time-off policies.',
      points: [
        'Overtime limits',
        'Overlap prevention',
        'Conflict/error flagging',
        'Skill-based matching',
        'Clock-in restrictions',
        'Payroll data export',
      ],
      icon: '🔒',
      image: '/images/compliance_image.png',
      imageAlt: 'Padlock representing security',
    },
    {
      title: 'Get real-time clarity',
      desc: 'Live schedule updates, notifications, and team chat keep everyone in sync.',
      points: [
        'Live schedule updates',
        'Mobile access to shift info',
        'On-shift team chat',
        'Planned vs. actual labor view',
        "Overview of who's late/absent",
        'Shift progress tracking',
      ],
      icon: '📈',
      image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&w=600&q=80',
    },
  ];
  const [activeFeature, setActiveFeature] = useState(0);
  const [fade, setFade] = useState(false);

  // Enhanced smooth transition handler
  const handleFeatureClick = (idx) => {
    if (idx === activeFeature) return;
    setFade(true);
    setTimeout(() => {
      setActiveFeature(idx);
      setFade(false);
    }, 250); // 250ms fade/slide out, then fade/slide in
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-0 py-0 font-sans">
      {/* Header */}
      <header className="w-full sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-blue-100 shadow-sm">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-9 h-9">{LogoSymbol}</span>
            <span className="text-xl font-bold text-blue-700 tracking-tight">ShiftSync</span>
          </div>
          <ul className="hidden md:flex gap-8 items-center text-blue-700 font-medium">
            <li><a href="#features" className="hover:text-blue-500 transition">Features</a></li>
            <li><a href="#how" className="hover:text-blue-500 transition">How it Works</a></li>
            <li><a href="#pricing" className="hover:text-blue-500 transition">Pricing</a></li>
            <li><a href="#faq" className="hover:text-blue-500 transition">FAQ</a></li>
            <li><a href="/signup" className="ml-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition">Get Started</a></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-blue-700 via-blue-500 to-blue-400 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-12">
          <div className="flex-1 max-w-xl z-10 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">Effortless Scheduling for Modern Teams</h1>
            <p className="text-lg sm:text-2xl mb-8 font-medium">ShiftSync makes workforce management simple, fast, and collaborative for small businesses and their employees.</p>
            <a href="/signup" className="inline-block px-8 py-3 bg-white text-blue-700 font-bold rounded-lg shadow hover:bg-blue-50 transition text-lg transform hover:scale-105 focus:scale-105 active:scale-95 duration-200">Get Started Free</a>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center text-sm opacity-80 mt-6">
              <span>No credit card required</span>
              <span className="hidden sm:inline">•</span>
              <span>Quick setup</span>
              <span className="hidden sm:inline">•</span>
              <span>Free for small teams</span>
            </div>
          </div>
          <div className="flex-1 flex justify-center md:justify-end z-10">
            {/* Product mockup image from Unsplash */}
            <img
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80"
              alt="ShiftSync dashboard mockup"
              className="w-full max-w-md rounded-2xl shadow-lg object-cover"
            />
          </div>
        </div>
      </section>

      {/* Feature Highlights - Accordion/Tab Style */}
      <section id="features" className="w-full py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          {/* Left: Feature Tabs/Accordion */}
          <div className="flex-1 w-full max-w-xl">
            <h2 className="text-2xl font-bold text-blue-800 mb-8">Why Choose ShiftSync?</h2>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {features.map((feature, idx) => (
                <div key={feature.title}>
                  <button
                    className={`w-full flex items-center justify-between py-4 px-2 text-left font-semibold text-lg transition focus:outline-none ${activeFeature === idx ? 'text-blue-700' : 'text-blue-500'}`}
                    onClick={() => handleFeatureClick(idx)}
                    aria-expanded={activeFeature === idx}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">{feature.icon}</span>
                      {feature.title}
                    </span>
                    <span className="ml-2 text-blue-400">{activeFeature === idx ? '▲' : '▼'}</span>
                  </button>
                  {activeFeature === idx && (
                    <div
                      className={`pl-8 pb-6 transition-all duration-300 ${fade ? 'opacity-0 scale-95 -translate-x-8' : 'opacity-100 scale-100 translate-x-0'}`}
                      style={{
                        transform: fade
                          ? 'scale(0.95) translateX(-32px)'
                          : 'scale(1) translateX(0)',
                      }}
                    >
                      <div className="text-blue-700 mb-2 text-base">{feature.desc}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-4">
                        {feature.points.map((point, i) => (
                          <div key={point} className="flex items-start gap-2 text-blue-700 text-sm">
                            <span className="mt-1 text-blue-400">
                              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#bae6fd"/><path d="M7 13l3 3 7-7" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {idx !== features.length - 1 && <hr className="my-2 border-blue-100" />}
                </div>
              ))}
            </div>
          </div>
          {/* Right: Feature Image with Soft Background */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 rounded-2xl" style={{ background: '#ede9fe', filter: 'blur(24px)', zIndex: 0 }}></div>
              <img
                src={features[activeFeature].image}
                alt={features[activeFeature].imageAlt || features[activeFeature].title}
                className={`relative z-10 w-full rounded-2xl shadow-lg object-cover transition-all duration-300 ${fade ? 'opacity-0 scale-95 translate-x-8' : 'opacity-100 scale-100 translate-x-0'}`}
                style={{
                  transform: fade
                    ? 'scale(0.95) translateX(32px)'
                    : 'scale(1) translateX(0)',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Stepper */}
      <section id="how" className="w-full py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-800 mb-10 text-center">How ShiftSync Works</h2>
          <div className="flex flex-col lg:flex-row gap-8 w-full items-center justify-center">
            {[
              { icon: '🛠️', title: 'Plan & Build', desc: 'Schedule in a few clicks with templates or drag-and-drop tools.' },
              { icon: '📤', title: 'Share & Confirm', desc: 'Instantly publish schedules for your team to view and approve.' },
              { icon: '🔄', title: 'Stay in Control', desc: 'Handle last-minute changes, see workflow, and reach staff live.' },
              { icon: '💸', title: 'Sync & Pay', desc: 'Link to time clock, generate timesheets, and integrate with payroll.' },
            ].map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center animate-fadein" style={{ animationDelay: `${0.7 + i * 0.05}s`, animationFillMode: 'both' }}>
                <div className="bg-blue-100 rounded-full p-4 mb-3 text-2xl">{step.icon}</div>
                <h4 className="font-semibold text-blue-700 mb-1">{step.title}</h4>
                <p className="text-blue-700 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo/Video Section */}
      <section className="w-full py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex items-center justify-center">
            {/* Demo video image from Unsplash */}
            <div className="relative w-full max-w-md">
              <img
                src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80"
                alt="Demo video preview"
                className="w-full rounded-2xl shadow-lg object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-300 transition">
                  <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#38bdf8"/><polygon points="13,10 24,16 13,22" fill="#fff"/></svg>
                </span>
              </span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-blue-800 mb-4">Scheduling should be easy</h3>
            <p className="text-blue-700 mb-6">See how ShiftSync helps you create, share, and manage schedules in just a few clicks. Watch our quick demo!</p>
            <a href="/signup" className="inline-block px-6 py-3 bg-blue-200 text-blue-800 font-bold rounded-lg shadow hover:bg-blue-300 transition text-lg transform hover:scale-105 focus:scale-105 active:scale-95 duration-200">Create a free account</a>
          </div>
        </div>
      </section>

      {/* Social Proof / Awards */}
      <section className="w-full py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h4 className="text-blue-700 font-semibold mb-4 text-center">Award-Winning Scheduling Software</h4>
          <div className="flex flex-wrap gap-6 justify-center items-center">
            {['Top Rated', 'Best Value', 'Users Love Us', "Editor's Choice"].map((badge) => (
              <div key={badge} className="bg-blue-100 rounded-full px-6 py-2 text-blue-700 font-bold shadow text-sm">{badge}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Offer Section */}
      <section id="pricing" className="w-full py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-blue-800 mb-4">100% free for small teams</h3>
            <p className="text-blue-700 mb-6">ShiftSync is free for small teams. Get unlimited access to all premium features at no cost for up to 10 users!</p>
            <a href="/signup" className="inline-block px-6 py-3 bg-blue-200 text-blue-800 font-bold rounded-lg shadow hover:bg-blue-300 transition text-lg transform hover:scale-105 focus:scale-105 active:scale-95 duration-200">Claim your FREE account</a>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {/* Offer image from Pexels */}
            <img
              src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&w=400&q=80"
              alt="Happy small business team"
              className="w-full max-w-xs rounded-2xl shadow-lg object-cover"
            />
          </div>
        </div>
      </section>

      {/* FAQ / Accordion Section */}
      <section id="faq" className="w-full py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-blue-800 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="w-full max-w-2xl mx-auto">
            {faqs.map((faq, idx) => (
              <div key={faq.q} className="mb-4 border-b border-blue-100">
                <button
                  className="w-full text-left py-4 px-2 flex justify-between items-center text-blue-700 font-semibold focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  aria-expanded={openFaq === idx}
                >
                  {faq.q}
                  <span className="ml-2 text-blue-400">{openFaq === idx ? '-' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="px-2 pb-4 text-blue-600 animate-fadein" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gradient-to-br from-blue-100 via-blue-50 to-white border-t border-blue-100 mt-auto py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <span className="inline-block w-9 h-9">{LogoSymbol}</span>
            <span className="text-xl font-bold text-blue-700 tracking-tight">ShiftSync</span>
          </div>
          <ul className="flex gap-6 items-center text-blue-700 font-medium">
            <li><a href="#features" className="hover:text-blue-500 transition">Features</a></li>
            <li><a href="#how" className="hover:text-blue-500 transition">How it Works</a></li>
            <li><a href="#pricing" className="hover:text-blue-500 transition">Pricing</a></li>
            <li><a href="#faq" className="hover:text-blue-500 transition">FAQ</a></li>
            <li><a href="/signup" className="ml-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition">Get Started</a></li>
          </ul>
          <div className="flex gap-4 items-center">
            <a href="#" className="text-blue-400 hover:text-blue-600 transition" aria-label="Twitter"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M22 5.924c-.793.352-1.645.59-2.54.698a4.48 4.48 0 0 0 1.963-2.475 8.94 8.94 0 0 1-2.828 1.082A4.48 4.48 0 0 0 12 9.482c0 .352.04.695.116 1.022C8.728 10.36 5.8 8.77 3.797 6.36a4.48 4.48 0 0 0-.607 2.255c0 1.555.792 2.927 2.002 3.732a4.48 4.48 0 0 1-2.03-.561v.057a4.48 4.48 0 0 0 3.6 4.393 4.48 4.48 0 0 1-2.025.077 4.48 4.48 0 0 0 4.18 3.11A8.98 8.98 0 0 1 2 19.07a12.7 12.7 0 0 0 6.88 2.017c8.26 0 12.78-6.84 12.78-12.78 0-.195-.004-.39-.013-.583A9.14 9.14 0 0 0 24 4.59a8.94 8.94 0 0 1-2.54.698z" fill="currentColor"/></svg></a>
            <a href="#" className="text-blue-400 hover:text-blue-600 transition" aria-label="LinkedIn"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.29c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.29h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z" fill="currentColor"/></svg></a>
            <a href="#" className="text-blue-400 hover:text-blue-600 transition" aria-label="Facebook"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.733 0-1.325.592-1.325 1.325v21.351c0 .732.592 1.324 1.325 1.324h11.495v-9.294h-3.124v-3.622h3.124v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24h-1.918c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12v9.294h6.116c.73 0 1.322-.592 1.322-1.324v-21.35c0-.733-.592-1.325-1.325-1.325z" fill="currentColor"/></svg></a>
          </div>
        </div>
        <div className="text-center text-blue-300 text-xs mt-6">&copy; {new Date().getFullYear()} ShiftSync. All rights reserved.</div>
      </footer>
    </main>
  );
}
