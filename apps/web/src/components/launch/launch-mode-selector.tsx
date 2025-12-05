'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Globe, 
  Shield, 
  Layers,
  CheckCircle,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type LaunchMode = 
  | 'ZK_SINGLE_CHAIN' 
  | 'ZK_SPLIT_MULTICHAIN' 
  | 'L1_SINGLE_CHAIN' 
  | 'L1_SPLIT_MULTICHAIN';

interface LaunchModeOption {
  id: LaunchMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  recommended?: boolean;
  comingSoon?: boolean;
}

const launchModes: LaunchModeOption[] = [
  {
    id: 'L1_SINGLE_CHAIN',
    name: 'Standard Launch',
    description: 'Deploy on a single chain with bonding curve presale',
    icon: <Layers className="h-6 w-6" />,
    features: [
      'Simple deployment',
      'Lower gas costs',
      'Fast graduation',
      'Single chain liquidity',
    ],
    recommended: true,
  },
  {
    id: 'L1_SPLIT_MULTICHAIN',
    name: 'Multi-Chain Launch',
    description: 'Deploy to multiple chains after graduation',
    icon: <Globe className="h-6 w-6" />,
    features: [
      'Cross-chain deployment',
      'Wider reach',
      'Bridge integration',
      'Split liquidity pools',
    ],
  },
  {
    id: 'ZK_SINGLE_CHAIN',
    name: 'ZK Private Launch',
    description: 'Privacy-preserving presale with ZK rollup',
    icon: <Shield className="h-6 w-6" />,
    features: [
      'Private contributions',
      'Lower fees on L2',
      'MEV protection',
      'Batch settlements',
    ],
    comingSoon: true,
  },
  {
    id: 'ZK_SPLIT_MULTICHAIN',
    name: 'ZK Multi-Chain',
    description: 'ZK presale with multi-chain graduation',
    icon: <Zap className="h-6 w-6" />,
    features: [
      'Ultimate privacy',
      'Multi-chain reach',
      'Advanced bridging',
      'Maximum flexibility',
    ],
    comingSoon: true,
  },
];

interface LaunchModeSelectorProps {
  value: LaunchMode;
  onChange: (mode: LaunchMode) => void;
  className?: string;
}

export function LaunchModeSelector({ 
  value, 
  onChange, 
  className 
}: LaunchModeSelectorProps) {
  return (
    <TooltipProvider>
      <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
        {launchModes.map((mode) => (
          <Card
            key={mode.id}
            className={cn(
              'relative p-4 cursor-pointer transition-all duration-200',
              'hover:border-primary/50',
              value === mode.id && 'border-primary bg-primary/5',
              mode.comingSoon && 'opacity-60 cursor-not-allowed'
            )}
            onClick={() => !mode.comingSoon && onChange(mode.id)}
          >
            {/* Selection indicator */}
            {value === mode.id && (
              <div className="absolute top-2 right-2">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
            )}

            {/* Badges */}
            <div className="flex gap-2 mb-3">
              {mode.recommended && (
                <Badge variant="default" className="text-xs">
                  Recommended
                </Badge>
              )}
              {mode.comingSoon && (
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              )}
            </div>

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className={cn(
                'p-2 rounded-lg',
                value === mode.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                {mode.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2">
                  {mode.name}
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{mode.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {mode.description}
                </p>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-1">
              {mode.features.map((feature, idx) => (
                <li 
                  key={idx}
                  className="text-xs text-muted-foreground flex items-center gap-2"
                >
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}

export default LaunchModeSelector;
