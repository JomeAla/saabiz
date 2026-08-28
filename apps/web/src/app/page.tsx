'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  Globe,
  CreditCard,
  ChartLine,
  Key,
  Users,
  CheckCircle,
  Menu,
  X,
  ChevronRight,
  Star,
  Play,
  Pause,
  Box,
  ArrowUpRight
} from 'lucide-react';

const features = [
  {
    icon: Globe,
    title: 'Global Payments',
    description: 'Accept payments from 180+ countries with Paystack and Flutterwave integration.',
    color: 'var(--accent-primary)',
  },
  {
    icon: Zap,
    title: 'Instant Licensing',
    description: 'Generate license keys instantly with OTA updates and device binding.',
    color: '#f59e0b',
  },
  {
    icon: ChartLine,
    title: 'Revenue Analytics',
    description: 'Track MRR, LTV, churn rate, and revenue with real-time charts.',
    color: '#8b5cf6',
  },
  {
    icon: Users,
    title: 'Affiliate System',
    description: 'Built-in affiliate program with commission tracking and payouts.',
    color: '#ec4899',
  },
  {
    icon: Shield,
    title: 'Tax Compliance',
    description: 'Automated tax calculation for 50+ countries. Stay compliant everywhere.',
    color: '#14b8a6',
  },
  {
    icon: CreditCard,
    title: 'Smart Subscriptions',
    description: 'Recurring billing with prorated upgrades, downgrades, and trials.',
    color: '#f97316',
  },
];

const stats = [
  { value: '₦10M+', label: 'Processed Annually', icon: CreditCard },
  { value: '99.9%', label: 'Uptime SLA', icon: Shield },
  { value: '180+', label: 'Countries', icon: Globe },
  { value: '50K+', label: 'Developers', icon: Users },
];

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for testing the platform',
    features: ['3 products', '5% platform fee', 'Email support', 'Basic analytics'],
    popular: false,
    cta: 'Get Started',
  },
  {
    name: 'Growth',
    price: '₦49',
    period: '/month',
    description: 'For growing software businesses',
    features: ['Unlimited products', '3% platform fee', 'Priority support', 'Advanced analytics', 'Custom domain'],
    popular: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large-scale operations',
    features: ['Everything in Growth', 'Custom pricing', 'Dedicated support', 'SLA guarantee', 'Custom integrations'],
    popular: false,
    cta: 'Contact Sales',
  },
];

const testimonials = [
  {
    name: 'Marcus Chen',
    role: 'Founder, DevTools Pro',
    content: 'Saabiz cut our payment infrastructure time from weeks to hours. The tax compliance alone is worth it.',
    avatar: 'MC',
    rating: 5,
  },
  {
    name: 'Sarah Mitchell',
    role: 'CTO, CloudSync',
    content: 'The affiliate system integration was seamless. We saw a 40% increase in referred sales within the first month.',
    avatar: 'SM',
    rating: 5,
  },
  {
    name: 'James Rodriguez',
    role: 'CEO, SaaStack',
    content: 'Finally, a platform that handles the boring stuff so we can focus on building great software.',
    avatar: 'JR',
    rating: 5,
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'py-4' : 'py-6'
        }`}
      >
        <div 
          className={`transition-all duration-300 ${
            scrolled 
              ? 'glass py-3 px-6 mx-4 md:mx-8 rounded-2xl' 
              : ''
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-muted) 100%)',
                  boxShadow: '0 4px 16px -4px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Box className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <span className="text-xl font-semibold text-white">Saabiz</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/marketplace" className="text-sm text-gray-400 hover:text-white transition-colors">
                Marketplace
              </Link>
              <Link href="/#features" className="text-sm text-gray-400 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors">
                Reviews
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="btn-ghost text-sm">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Start Free
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-24 z-40 px-4"
          >
            <div className="glass rounded-2xl p-6 space-y-4">
              <Link href="/marketplace" className="block text-gray-300 hover:text-white">Marketplace</Link>
              <Link href="/#features" className="block text-gray-300 hover:text-white">Features</Link>
              <Link href="/#pricing" className="block text-gray-300 hover:text-white">Pricing</Link>
              <Link href="/login" className="block text-gray-300 hover:text-white">Sign in</Link>
              <Link href="/register" className="btn-primary w-full text-center">Start Free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[100dvh] flex items-center pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[150px]" 
            style={{ background: 'rgba(16, 185, 129, 0.1)' }} 
          />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[120px]"
            style={{ background: 'rgba(16, 185, 129, 0.05)' }}
          />
        </div>
        <div className="absolute inset-0 bg-grid opacity-30" />
        
        <motion.div style={{ y, opacity }} className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent-primary)' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent-primary)' }} />
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                  Now supporting 180+ countries
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="display-xl text-white mb-6"
              >
                Sell software{' '}
                <span className="gradient-text">globally</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="body-lg text-gray-400 mb-10 max-w-lg"
              >
                The complete merchant of record platform. Accept payments worldwide, 
                manage licenses, handle taxes, and scale your SaaS business.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/register" className="btn-primary text-base px-8 py-4 group">
                  <span>Start selling free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/marketplace" className="btn-secondary text-base px-8 py-4">
                  View marketplace
                </Link>
              </motion.div>

              {/* Trust */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-6 mt-10"
              >
                <div className="flex -space-x-2">
                  {['M', 'S', 'J', 'A'].map((initial, i) => (
                    <div 
                      key={i}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                      style={{ 
                        background: `hsl(${160 + i * 20}, 70%, 50%)`,
                        border: '2px solid var(--bg-primary)'
                      }}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" strokeWidth={0} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Trusted by 50,000+ developers</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--gray-800)' }}>
                {/* Dashboard Header */}
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--gray-800)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-full text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--gray-400)' }}>
                      saabiz.com/dashboard
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="p-6 space-y-4">
                  {/* Revenue Card */}
                  <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Total Revenue</span>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)' }}>
                        +24.5%
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-4">₦127,450.00</div>
                    {/* Chart */}
                    <div className="flex items-end gap-1 h-16">
                      {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                          className="flex-1 rounded-t"
                          style={{ background: i === 11 ? 'var(--accent-primary)' : 'var(--gray-700)' }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="text-sm text-gray-400 mb-1">Active Licenses</div>
                      <div className="text-xl font-semibold text-white">2,847</div>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="text-sm text-gray-400 mb-1">MRR</div>
                      <div className="text-xl font-semibold text-white">₦18,250</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -left-8 top-1/4 glass p-4 rounded-xl shadow-xl -rotate-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <CreditCard className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">New Sale</div>
                    <div className="text-sm font-medium text-white">+₦299.00</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
                className="absolute -right-4 bottom-1/4 glass p-4 rounded-xl shadow-xl rotate-3"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-sm font-medium text-white">Payment verified</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-1 rounded-full"
              style={{ background: 'var(--gray-500)' }}
            />
          </div>
        </motion.div>
      </section>

      {/* Logos Section */}
      <section className="py-16 border-y" style={{ borderColor: 'var(--gray-800)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8">Trusted by leading software companies</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
            {['Vercel', 'Stripe', 'Linear', 'Notion', 'Figma', 'Slack'].map((brand) => (
              <span key={brand} className="text-xl font-semibold text-gray-400">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="absolute inset-0 bg-glow-top" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <h2 className="display-md text-white mb-6">
              Everything you need to{' '}
              <span className="gradient-text">scale</span>
            </h2>
            <p className="body-lg text-gray-400">
              From payments to taxes, we handle the complexity so you can focus on building great products.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="group relative p-8 rounded-3xl transition-all duration-300 hover:scale-[1.02]"
                style={{ 
                  background: index === activeFeature ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  border: `1px solid ${index === activeFeature ? feature.color : 'var(--gray-800)'}`
                }}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `${feature.color}15` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} strokeWidth={1.5} />
                </div>
                <h3 className="heading-md text-white mb-3">{feature.title}</h3>
                <p className="body-sm text-gray-400">{feature.description}</p>
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: feature.color }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="display-md text-white mb-6">
                Go live in{' '}
                <span className="gradient-text">minutes</span>
              </h2>
              <p className="body-lg text-gray-400 mb-12">
                No complex integration docs or months of development. Just a few API calls and you are ready to accept payments globally.
              </p>

              <div className="space-y-8">
                {[
                  { step: '01', title: 'Create your account', desc: 'Sign up in seconds and access your dashboard.' },
                  { step: '02', title: 'Add your product', desc: 'Upload your software and set up pricing plans.' },
                  { step: '03', title: 'Share your link', desc: 'Get your checkout link or embed our widget.' },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="text-6xl font-bold text-gray-800 leading-none">{item.step}</div>
                    <div>
                      <h4 className="heading-md text-white mb-2">{item.title}</h4>
                      <p className="body-sm text-gray-400">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right - Code Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--gray-800)' }}>
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--gray-800)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-gray-500">payment.ts</span>
                </div>
                <pre className="p-6 text-sm overflow-x-auto font-mono text-gray-400 leading-relaxed">
{`import { Saabiz } from '@saabiz/sdk';

// Initialize payment
const payment = await saabiz.payments.create({
  amount: 4900,
  currency: 'ngn',
  customer: 'user_123',
});

// Generate license
const license = await saabiz.licenses.create({
  product: 'pro_version',
  customer: payment.customer,
});

// Done! License sent to customer
console.log(\`License: \${license.key}\`);`}
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative">
        <div className="absolute inset-0 bg-glow-top" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="display-md text-white mb-6">
              Simple, transparent{' '}
              <span className="gradient-text">pricing</span>
            </h2>
            <p className="body-lg text-gray-400">
              No hidden fees. No surprises. Pay only for what you use.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-8 rounded-3xl transition-transform hover:scale-[1.02] ${
                  plan.popular ? 'scale-[1.05]' : ''
                }`}
                style={{ 
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${plan.popular ? 'var(--accent-primary)' : 'var(--gray-800)'}`,
                  boxShadow: plan.popular ? '0 0 40px -10px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                {plan.popular && (
                  <div 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                  >
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="heading-lg text-white mb-2">{plan.name}</h3>
                  <p className="body-sm text-gray-400">{plan.description}</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-500">{plan.period}</span>}
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                      <span className="body-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/register" 
                  className={plan.popular ? 'btn-primary w-full' : 'btn-secondary w-full'}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="display-md text-white mb-6">
              Loved by{' '}
              <span className="gradient-text">developers</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-3xl"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--gray-800)' }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" strokeWidth={0} />
                  ))}
                </div>
                <p className="body-md text-gray-300 mb-6">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }} />
        <div className="absolute inset-0 bg-glow-top" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        >
          <h2 className="display-md text-white mb-6">
            Ready to{' '}
            <span className="gradient-text">scale</span>?
          </h2>
          <p className="body-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of developers selling software worldwide. No credit card required to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-base px-10 py-4 group">
              <span>Start selling free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/#features" className="btn-secondary text-base px-10 py-4">
              Learn more
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t" style={{ borderColor: 'var(--gray-800)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-muted) 100%)' }}
                >
                  <Box className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <span className="text-xl font-semibold text-white">Saabiz</span>
              </div>
              <p className="body-sm text-gray-400 max-w-xs">
                The complete merchant of record platform for software developers.
              </p>
            </div>
            
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Marketplace', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'GDPR'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-medium text-white mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: 'var(--gray-800)' }}>
            <p className="text-sm text-gray-500">2026 Saabiz. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
