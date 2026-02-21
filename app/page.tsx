import Link from 'next/link';
import { MessageSquare, BarChart3, Zap, Shield, CheckCircle2, ArrowRight, Star, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      {/* Navbar */}
      <nav className="border-b px-6 py-4" style={{ borderColor: '#222222' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6" style={{ color: '#00ff88' }} />
            <span className="text-xl font-bold" style={{ color: '#ffffff' }}>
              TinyFeedback
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/demo" 
              className="text-sm transition-colors hover:text-white"
              style={{ color: '#888888' }}
            >
              Demo
            </Link>
            <Link 
              href="/login" 
              className="text-sm transition-colors hover:text-white"
              style={{ color: '#888888' }}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: '#00ff88',
                color: '#000000',
              }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 text-sm"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #222222',
              color: '#00ff88'
            }}
          >
            <Star className="w-4 h-4" />
            <span>Free for up to 100 feedbacks/month</span>
          </div>
          
          <h1 
            className="text-5xl md:text-6xl font-bold leading-tight"
            style={{ color: '#ffffff' }}
          >
            Collect Feedback from Your
            <span style={{ color: '#00ff88' }}> SaaS Users</span>
            <br />in Seconds
          </h1>
          
          <p className="text-xl max-w-2xl mx-auto" style={{ color: '#888888' }}>
            One line of code. NPS scores, feature requests, and bug reports 
            directly from your app. No complex setup, no hefty price tags.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 text-lg font-medium transition-colors flex items-center gap-2"
              style={{
                backgroundColor: '#00ff88',
                color: '#000000',
              }}
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="px-8 py-4 text-lg font-medium transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '1px solid #333333',
              }}
            >
              See Demo
            </Link>
          </div>

          <p className="text-sm" style={{ color: '#666666' }}>
            No credit card required • Setup in 2 minutes
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-12 border-y" style={{ borderColor: '#111111', backgroundColor: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <p className="text-sm uppercase tracking-wider" style={{ color: '#666666' }}>
            Trusted by indie hackers and solopreneurs
          </p>
          <div className="flex items-center justify-center gap-8 text-lg" style={{ color: '#444444' }}>
            <span>"Simple and effective"</span>
            <span>•</span>
            <span>"Took 5 minutes to set up"</span>
            <span>•</span>
            <span>"Finally, affordable feedback"</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#ffffff' }}>
              Everything You Need, Nothing You Don't
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#888888' }}>
              Stop overpaying for bloated feedback tools. TinyFeedback gives you exactly what you need to understand your users.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div 
              className="p-8 space-y-4"
              style={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #222222' 
              }}
            >
              <div 
                className="w-12 h-12 flex items-center justify-center"
                style={{ backgroundColor: '#00ff8820' }}
              >
                <MessageSquare className="w-6 h-6" style={{ color: '#00ff88' }} />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                One-Line Installation
              </h3>
              <p style={{ color: '#888888' }}>
                Copy and paste a single line of code. The widget appears instantly on your site. No complex configuration needed.
              </p>
            </div>

            {/* Feature 2 */}
            <div 
              className="p-8 space-y-4"
              style={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #222222' 
              }}
            >
              <div 
                className="w-12 h-12 flex items-center justify-center"
                style={{ backgroundColor: '#00ff8820' }}
              >
                <BarChart3 className="w-6 h-6" style={{ color: '#00ff88' }} />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                NPS + Feedback Types
              </h3>
              <p style={{ color: '#888888' }}>
                Collect NPS scores, feature requests, bug reports, and general feedback. All organized in your dashboard.
              </p>
            </div>

            {/* Feature 3 */}
            <div 
              className="p-8 space-y-4"
              style={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #222222' 
              }}
            >
              <div 
                className="w-12 h-12 flex items-center justify-center"
                style={{ backgroundColor: '#00ff8820' }}
              >
                <Zap className="w-6 h-6" style={{ color: '#00ff88' }} />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                Real-Time Dashboard
              </h3>
              <p style={{ color: '#888888' }}>
                See feedback as it comes in. Filter by type, status, or date. Track NPS trends over time.
              </p>
            </div>

            {/* Feature 4 */}
            <div 
              className="p-8 space-y-4"
              style={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #222222' 
              }}
            >
              <div 
                className="w-12 h-12 flex items-center justify-center"
                style={{ backgroundColor: '#00ff8820' }}
              >
                <Shield className="w-6 h-6" style={{ color: '#00ff88' }} />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                Privacy First
              </h3>
              <p style={{ color: '#888888' }}>
                No tracking, no cookies, no nonsense. Just pure feedback collection. Your users' data stays private.
              </p>
            </div>

            {/* Feature 5 */}
            <div 
              className="p-8 space-y-4"
              style={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #222222' 
              }}
            >
              <div 
                className="w-12 h-12 flex items-center justify-center"
                style={{ backgroundColor: '#00ff8820' }}
              >
                <Users className="w-6 h-6" style={{ color: '#00ff88' }} />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                Team Collaboration
              </h3>
              <p style={{ color: '#888888' }}>
                Invite team members, assign feedback, add internal notes. Work together to improve your product.
              </p>
            </div>

            {/* Feature 6 */}
            <div 
              className="p-8 space-y-4"
              style={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #222222' 
              }}
            >
              <div 
                className="w-12 h-12 flex items-center justify-center"
                style={{ backgroundColor: '#00ff8820' }}
              >
                <CheckCircle2 className="w-6 h-6" style={{ color: '#00ff88' }} />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                Status Workflow
              </h3>
              <p style={{ color: '#888888' }}>
                Track feedback from 'New' to 'In Analysis' to 'Implemented'. Never lose track of user requests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 py-24" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#ffffff' }}>
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg" style={{ color: '#888888' }}>
              Start free. Scale when you need to. No surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div 
              className="p-8 space-y-6"
              style={{ 
                backgroundColor: '#000000', 
                border: '1px solid #222222' 
              }}
            >
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#ffffff' }}>
                  Starter
                </h3>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Perfect for side projects
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: '#ffffff' }}>$0</span>
                <span style={{ color: '#666666' }}>/month</span>
              </div>
              <ul className="space-y-3">
                {[
                  'Up to 100 feedbacks/month',
                  'NPS collection',
                  'Basic dashboard',
                  'Email notifications',
                  '1 team member',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm" style={{ color: '#888888' }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#00ff88' }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 text-center font-medium transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid #333333',
                }}
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div 
              className="p-8 space-y-6 relative"
              style={{ 
                backgroundColor: '#000000', 
                border: '2px solid #00ff88' 
              }}
            >
              <div 
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-medium"
                style={{ 
                  backgroundColor: '#00ff88', 
                  color: '#000000' 
                }}
              >
                MOST POPULAR
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#ffffff' }}>
                  Pro
                </h3>
                <p className="text-sm" style={{ color: '#666666' }}>
                  For growing SaaS businesses
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: '#ffffff' }}>$15</span>
                <span style={{ color: '#666666' }}>/month</span>
              </div>
              <ul className="space-y-3">
                {[
                  'Unlimited feedbacks',
                  'Everything in Starter',
                  'Unlimited team members',
                  'Priority support',
                  'Custom branding',
                  'Advanced analytics',
                  'API access',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm" style={{ color: '#888888' }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#00ff88' }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 text-center font-medium transition-colors"
                style={{
                  backgroundColor: '#00ff88',
                  color: '#000000',
                }}
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          <p className="text-center text-sm" style={{ color: '#666666' }}>
            Compare with Canny ($50+/mo) or Featurebase ($40+/mo). We built TinyFeedback because we were tired of overpaying.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#ffffff' }}>
            Ready to Understand Your Users?
          </h2>
          <p className="text-lg" style={{ color: '#888888' }}>
            Join hundreds of indie hackers who use TinyFeedback to build better products.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 text-lg font-medium transition-colors flex items-center gap-2"
              style={{
                backgroundColor: '#00ff88',
                color: '#000000',
              }}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-sm" style={{ color: '#666666' }}>
            Free forever for up to 100 feedbacks/month. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t" style={{ borderColor: '#111111' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" style={{ color: '#00ff88' }} />
              <span className="font-semibold" style={{ color: '#ffffff' }}>
                TinyFeedback
              </span>
            </div>
            <p className="text-sm" style={{ color: '#666666' }}>
              © 2025 TinyFeedback. Built with 💚 for indie hackers.
            </p>
            <div className="flex items-center gap-6">
              <Link 
                href="/demo" 
                className="text-sm transition-colors hover:text-white"
                style={{ color: '#666666' }}
              >
                Demo
              </Link>
              <Link 
                href="/login" 
                className="text-sm transition-colors hover:text-white"
                style={{ color: '#666666' }}
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="text-sm transition-colors hover:text-white"
                style={{ color: '#666666' }}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
