'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Flame, Globe, Zap, Shield, Rocket, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectButton } from '@/components/wallet/connect-button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image 
              src="/xferno.svg" 
              alt="XFERNO Logo" 
              width={144} 
              height={32}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/tokens" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link href="/launch" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Launch
            </Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <ConnectButton />
            <Link href="/launch">
              <Button size="sm" className="bg-gradient-fire hover:opacity-90">
                Launch Token
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-xferno-fire/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-xferno-fire/10 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-xferno-fire/10 text-xferno-fire text-sm font-medium mb-6">
              <Flame className="h-4 w-4" />
              <span>Now Live on Ethereum & BDAG</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Launch here,{' '}
              <span className="text-gradient-fire">graduate to the multiverse</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The professional-grade, multi-chain token launchpad. Start with a presale, 
              hit your target, and automatically deploy across multiple blockchains.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/launch">
                <Button size="lg" className="bg-gradient-fire hover:opacity-90 text-lg px-8">
                  Launch Your Token
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/tokens">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Explore Tokens
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/40">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Total Volume', value: '$12.5M' },
              { label: 'Tokens Launched', value: '1,234' },
              { label: 'Successful Graduations', value: '567' },
              { label: 'Networks Supported', value: '8' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gradient-fire mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Four ways to launch
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the launch mode that fits your project. From single-chain simplicity 
              to multi-chain ZK-powered tokens.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'ZK Single-Chain',
                description: 'Maximum privacy with ZK rollup integration on one network.',
                gradient: 'from-blue-500 to-purple-500',
              },
              {
                icon: Globe,
                title: 'ZK Multi-Chain',
                description: 'Privacy-preserving tokens deployed across multiple networks.',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                icon: Zap,
                title: 'L1 Single-Chain',
                description: 'Standard token launch on your preferred network.',
                gradient: 'from-orange-500 to-red-500',
              },
              {
                icon: Rocket,
                title: 'L1 Multi-Chain',
                description: 'Native tokens bridged across the entire ecosystem.',
                gradient: 'from-green-500 to-teal-500',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/50 transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Graduation Flow Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The graduation model
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start small, grow big. Our graduation model automatically deploys your token 
              to real DEX pools when you hit your funding target.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Launch Presale',
                  description: 'Configure your token and start a bonding curve presale. No upfront deployment costs.',
                },
                {
                  step: '02',
                  title: 'Build Community',
                  description: 'Trade on the pre-market while building momentum toward your graduation target.',
                },
                {
                  step: '03',
                  title: 'Graduate & Deploy',
                  description: 'Hit your target and we automatically deploy real contracts and seed liquidity across all your chosen networks.',
                },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="text-6xl font-bold text-muted-foreground/20 mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-fire opacity-90" />
            {/* Grid pattern background */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
            
            <div className="relative px-8 py-16 md:px-16 md:py-24 text-center text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to launch your token?
              </h2>
              <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join hundreds of projects that have successfully launched and graduated 
                to multi-chain presence with XFERNO.
              </p>
              <Link href="/launch">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center">
              <Image 
                src="/xferno.svg" 
                alt="XFERNO Logo" 
                width={120} 
                height={28}
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/tokens" className="hover:text-foreground transition-colors">
                Explore
              </Link>
              <Link href="/launch" className="hover:text-foreground transition-colors">
                Launch
              </Link>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 XFERNO. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
