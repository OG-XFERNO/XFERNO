import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Rocket,
  Coins,
  TrendingUp,
  Shield,
  Code,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

const docSections = [
  {
    title: 'Getting Started',
    icon: Rocket,
    description: 'Learn the basics of using XFERNO',
    articles: [
      { title: 'What is XFERNO?', href: '#' },
      { title: 'Connecting Your Wallet', href: '#' },
      { title: 'Your First Trade', href: '#' },
    ],
  },
  {
    title: 'Token Launch',
    icon: Coins,
    description: 'Create and launch your own token',
    articles: [
      { title: 'How Token Launch Works', href: '#' },
      { title: 'Bonding Curve Explained', href: '#' },
      { title: 'Launch Fees & Requirements', href: '#' },
    ],
  },
  {
    title: 'Trading',
    icon: TrendingUp,
    description: 'Buy and sell tokens on the platform',
    articles: [
      { title: 'How to Buy Tokens', href: '#' },
      { title: 'How to Sell Tokens', href: '#' },
      { title: 'Understanding Slippage', href: '#' },
      { title: 'Gas Fees Explained', href: '#' },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    description: 'Keep your assets safe',
    articles: [
      { title: 'Smart Contract Security', href: '#' },
      { title: 'Identifying Scams', href: '#' },
      { title: 'Best Practices', href: '#' },
    ],
  },
  {
    title: 'Developers',
    icon: Code,
    description: 'Build on top of XFERNO',
    articles: [
      { title: 'API Documentation', href: '#' },
      { title: 'Smart Contracts', href: '#' },
      { title: 'SDK & Libraries', href: '#' },
    ],
  },
  {
    title: 'FAQ',
    icon: HelpCircle,
    description: 'Frequently asked questions',
    articles: [
      { title: 'General Questions', href: '#' },
      { title: 'Trading FAQ', href: '#' },
      { title: 'Token Launch FAQ', href: '#' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="container py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge variant="fire" className="mb-4">
          <BookOpen className="w-3 h-3 mr-1" />
          Documentation
        </Badge>
        <h1 className="text-4xl font-bold mb-4">XFERNO Documentation</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about launching and trading tokens on XFERNO
        </p>
      </div>

      {/* Search - Placeholder */}
      <Card className="border-border/50 bg-card/50 backdrop-blur mb-12">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <BookOpen className="h-5 w-5" />
            <span>Search documentation coming soon...</span>
          </div>
        </CardContent>
      </Card>

      {/* Doc Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docSections.map((section) => (
          <Card
            key={section.title}
            className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-colors"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.articles.map((article) => (
                  <li key={article.title}>
                    <a
                      href={article.href}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {article.title}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <Card className="border-border/50 bg-card/50 backdrop-blur mt-12">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="https://github.com/xferno"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Code className="h-4 w-4" />
              <span className="text-sm">GitHub</span>
            </a>
            <a
              href="https://twitter.com/xferno"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">Twitter</span>
            </a>
            <a
              href="https://discord.gg/xferno"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">Discord</span>
            </a>
            <a
              href="mailto:support@xferno.io"
              className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm">Support</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
