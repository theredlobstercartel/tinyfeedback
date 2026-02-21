import Link from 'next/link';
import { 
  MessageSquare, 
  BarChart3, 
  Zap, 
  Shield, 
  Code2, 
  Bell,
  ArrowRight,
  Check,
  Star
} from 'lucide-react';

export const metadata = {
  title: 'TinyFeedback - Collect User Feedback That Actually Matters',
  description: 'The modern feedback platform for SaaS products. Collect, analyze, and act on user feedback with AI-powered insights.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#00ff88]" />
              <span className="text-xl font-bold text-white">TinyFeedback</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#888888] hover:text-[#00ff88] transition-colors">Features</a>
              <a href="#pricing" className="text-[#888888] hover:text-[#00ff88] transition-colors">Pricing</a>
              <a href="/demo" className="text-[#888888] hover:text-[#00ff88] transition-colors">Demo</a>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-[#888888] hover:text-white transition-colors hidden sm:block"
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="px-4 py-2 bg-[#00ff88] text-black font-medium hover:bg-[#00ffaa] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00ff88]/10 border border-[#00ff88]/30">
                <Star className="w-4 h-4 text-[#00ff88]" />
                <span className="text-sm text-[#00ff88]">Now with AI-powered insights</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Collect User Feedback{' '}
                <span className="text-[#00ff88] neon-text">That Actually Matters</span>
              </h1>
              <p className="text-lg text-[#888888] max-w-xl">
                TinyFeedback is the modern feedback platform for SaaS products. 
                Embed our widget in minutes, collect actionable insights, and 
                build products your users actually want.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#00ff88] text-black font-medium hover:bg-[#00ffaa] transition-colors group"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#00ff88] text-[#00ff88] font-medium hover:bg-[#00ff88]/10 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  View Demo
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-[#888888]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00ff88]" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00ff88]" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 blur-3xl" />
              <div className="relative bg-[#0a0a0a] border border-[#222222] p-6 space-y-4">
                <div className="flex items-center gap-2 pb-4 border-b border-[#222222]">
                  <div className="w-3 h-3 bg-[#ff5f56]" />
                  <div className="w-3 h-3 bg-[#ffbd2e]" />
                  <div className="w-3 h-3 bg-[#27ca40]" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-[#111111] border border-[#222222]">
                    <div className="w-8 h-8 bg-[#00ff88]/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-[#00ff88]" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-white text-sm font-medium">New Feature Request</p>
                      <p className="text-[#888888] text-xs">Add dark mode support for better UX at night...</p>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="px-2 py-0.5 text-xs bg-[#00ff88]/20 text-[#00ff88]">suggestion</span>
                        <span className="px-2 py-0.5 text-xs bg-[#222222] text-[#888888]">new</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-[#111111] border border-[#222222]">
                    <div className="w-8 h-8 bg-[#00d4ff]/20 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-[#00d4ff]" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-white text-sm font-medium">NPS Score: 72</p>
                      <p className="text-[#888888] text-xs">Based on 142 responses this month</p>
                      <div className="w-full h-2 bg-[#222222] mt-2">
                        <div className="w-3/4 h-full bg-gradient-to-r from-[#00ff88] to-[#00d4ff]" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-[#111111] border border-[#222222]">
                    <div className="w-8 h-8 bg-[#ffaa00]/20 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-[#ffaa00]" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-white text-sm font-medium">Daily Summary Ready</p>
                      <p className="text-[#888888] text-xs">12 new feedback items to review</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#222222]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to{' '}
              <span className="text-[#00ff88]">Understand Your Users</span>
            </h2>
            <p className="text-[#888888]">
              Powerful features designed to help you collect, analyze, and act on user feedback
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Code2,
                title: 'One-Line Integration',
                description: 'Drop our script tag into your HTML and start collecting feedback in under 60 seconds.',
                color: '#00ff88',
              },
              {
                icon: MessageSquare,
                title: 'Smart Widget',
                description: 'Beautiful, customizable feedback widget that matches your brand perfectly.',
                color: '#00d4ff',
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                description: 'Track NPS scores, sentiment trends, and feature requests in real-time.',
                color: '#ffaa00',
              },
              {
                icon: Bell,
                title: 'Smart Notifications',
                description: 'Get notified about critical feedback instantly. Never miss what matters.',
                color: '#ff4444',
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'SOC 2 compliant, GDPR ready, and end-to-end encrypted data storage.',
                color: '#00ff88',
              },
              {
                icon: Zap,
                title: 'AI-Powered Insights',
                description: 'Our AI automatically categorizes feedback and surfaces actionable insights.',
                color: '#00d4ff',
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="group p-6 bg-[#0a0a0a] border border-[#222222] hover:border-[#00ff88]/50 transition-all"
              >
                <div 
                  className="w-12 h-12 mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[#888888] text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a] border-y border-[#222222]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '10M+', label: 'Feedback Collected' },
              { value: '2,500+', label: 'Active Teams' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '<50ms', label: 'Response Time' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-[#00ff88] mb-2">{stat.value}</div>
                <div className="text-[#888888] text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Simple, Transparent{' '}
              <span className="text-[#00ff88]">Pricing</span>
            </h2>
            <p className="text-[#888888]">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                description: 'Perfect for side projects',
                features: [
                  'Up to 100 feedback/month',
                  'Basic analytics',
                  'Email notifications',
                  '1 project',
                  'Community support',
                ],
                cta: 'Get Started',
                popular: false,
              },
              {
                name: 'Pro',
                price: '$29',
                period: '/month',
                description: 'For growing SaaS products',
                features: [
                  'Unlimited feedback',
                  'Advanced analytics',
                  'Slack integration',
                  '10 projects',
                  'Priority support',
                  'Custom branding',
                  'API access',
                ],
                cta: 'Start Free Trial',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                description: 'For large organizations',
                features: [
                  'Everything in Pro',
                  'Unlimited projects',
                  'SSO & SAML',
                  'Custom contracts',
                  'Dedicated support',
                  'SLA guarantee',
                  'On-premise option',
                ],
                cta: 'Contact Sales',
                popular: false,
              },
            ].map((plan, index) => (
              <div 
                key={index}
                className={`p-6 border ${
                  plan.popular 
                    ? 'border-[#00ff88] bg-[#00ff88]/5' 
                    : 'border-[#222222] bg-[#0a0a0a]'
                }`}
              >
                {plan.popular && (
                  <div className="inline-block px-3 py-1 mb-4 text-xs font-medium bg-[#00ff88] text-black">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-[#888888]">{plan.period}</span>}
                </div>
                <p className="text-[#888888] text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-sm text-[#888888]">
                      <Check className="w-4 h-4 text-[#00ff88] flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === 'Enterprise' ? '/upgrade' : '/signup'}
                  className={`block w-full py-2 text-center font-medium transition-colors ${
                    plan.popular
                      ? 'bg-[#00ff88] text-black hover:bg-[#00ffaa]'
                      : 'border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#222222]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Collecting{' '}
            <span className="text-[#00ff88]">Better Feedback?</span>
          </h2>
          <p className="text-[#888888] mb-8 max-w-2xl mx-auto">
            Join thousands of teams using TinyFeedback to build products their users love.
            Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#00ff88] text-black font-medium hover:bg-[#00ffaa] transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-[#00ff88] text-[#00ff88] font-medium hover:bg-[#00ff88]/10 transition-colors"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[#222222]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#00ff88]" />
                <span className="text-lg font-bold text-white">TinyFeedback</span>
              </div>
              <p className="text-sm text-[#888888]">
                The modern feedback platform for SaaS products.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-[#888888]">
                <li><a href="#features" className="hover:text-[#00ff88]">Features</a></li>
                <li><a href="#pricing" className="hover:text-[#00ff88]">Pricing</a></li>
                <li><a href="/demo" className="hover:text-[#00ff88]">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-[#888888]">
                <li><a href="#" className="hover:text-[#00ff88]">About</a></li>
                <li><a href="#" className="hover:text-[#00ff88]">Blog</a></li>
                <li><a href="#" className="hover:text-[#00ff88]">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-[#888888]">
                <li><a href="#" className="hover:text-[#00ff88]">Privacy</a></li>
                <li><a href="#" className="hover:text-[#00ff88]">Terms</a></li>
                <li><a href="#" className="hover:text-[#00ff88]">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#222222] text-center text-sm text-[#888888]">
            © {new Date().getFullYear()} TinyFeedback. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
