'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Code,
  FileCode,
  BookOpen,
  Rocket,
  Shield,
  Zap,
  ExternalLink,
  Github,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';

export default function DevelopersPage() {
  return (
    <div className="container py-8 max-w-5xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
          Developer Program
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Build on XFERNO</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Access our APIs, SDKs, and tools to integrate XFERNO's token launch 
          infrastructure into your applications.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="border-orange-500/20 hover:border-orange-500/50 transition-colors">
          <CardHeader>
            <BookOpen className="h-8 w-8 text-orange-500 mb-2" />
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Comprehensive guides and API references
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/docs">
              <Button variant="outline" className="w-full">
                View Docs
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 hover:border-orange-500/50 transition-colors">
          <CardHeader>
            <Github className="h-8 w-8 text-orange-500 mb-2" />
            <CardTitle>GitHub</CardTitle>
            <CardDescription>
              SDKs, examples, and open-source tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 hover:border-orange-500/50 transition-colors">
          <CardHeader>
            <Terminal className="h-8 w-8 text-orange-500 mb-2" />
            <CardTitle>API Access</CardTitle>
            <CardDescription>
              Request API keys for your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>What You Can Build</CardTitle>
          <CardDescription>
            Leverage XFERNO's infrastructure for your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="p-2 rounded-lg bg-orange-500/10 h-fit">
                <Rocket className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Token Launch Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Integrate token creation and bonding curve mechanics into your platform
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-2 rounded-lg bg-orange-500/10 h-fit">
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Trading Bots</h3>
                <p className="text-sm text-muted-foreground">
                  Build automated trading strategies using our trading APIs
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-2 rounded-lg bg-orange-500/10 h-fit">
                <FileCode className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Analytics Dashboards</h3>
                <p className="text-sm text-muted-foreground">
                  Create custom analytics using our indexer and market data APIs
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-2 rounded-lg bg-orange-500/10 h-fit">
                <Shield className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Portfolio Trackers</h3>
                <p className="text-sm text-muted-foreground">
                  Track holdings and performance across XFERNO tokens
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30">
        <CardContent className="pt-6">
          <div className="text-center">
            <Code className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ready to Build?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join our developer program to get early access to APIs, SDKs, 
              and dedicated support from the XFERNO team.
            </p>
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90" disabled>
              Join Waitlist (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
