'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle,
  AlertCircle,
  Wallet
} from 'lucide-react';

// Network configuration
export interface NetworkConfig {
  id: string;
  name: string;
  chainId: number;
  icon: string;
  color: string;
  isTestnet: boolean;
  isMainnet: boolean;
  supported: boolean;
  comingSoon?: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const networks: NetworkConfig[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    icon: '⟠',
    color: '#627EEA',
    isTestnet: false,
    isMainnet: true,
    supported: true,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'sepolia',
    name: 'Sepolia',
    chainId: 11155111,
    icon: '⟠',
    color: '#627EEA',
    isTestnet: true,
    isMainnet: false,
    supported: true,
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    chainId: 42161,
    icon: '🔵',
    color: '#28A0F0',
    isTestnet: false,
    isMainnet: true,
    supported: true,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'optimism',
    name: 'Optimism',
    chainId: 10,
    icon: '🔴',
    color: '#FF0420',
    isTestnet: false,
    isMainnet: true,
    supported: true,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    icon: '🔵',
    color: '#0052FF',
    isTestnet: false,
    isMainnet: true,
    supported: true,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    icon: '💜',
    color: '#8247E5',
    isTestnet: false,
    isMainnet: true,
    supported: true,
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  {
    id: 'bnb',
    name: 'BNB Chain',
    chainId: 56,
    icon: '🟡',
    color: '#F0B90B',
    isTestnet: false,
    isMainnet: true,
    supported: false,
    comingSoon: true,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    chainId: 43114,
    icon: '🔺',
    color: '#E84142',
    isTestnet: false,
    isMainnet: true,
    supported: false,
    comingSoon: true,
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
  },
];

interface NetworkSelectorProps {
  mode: 'single' | 'multi';
  selectedNetwork?: string;
  selectedNetworks?: string[];
  baseNetwork?: string;
  onSelectNetwork?: (networkId: string) => void;
  onSelectNetworks?: (networkIds: string[]) => void;
  onSelectBaseNetwork?: (networkId: string) => void;
  showTestnets?: boolean;
  className?: string;
}

export function NetworkSelector({
  mode,
  selectedNetwork,
  selectedNetworks = [],
  baseNetwork,
  onSelectNetwork,
  onSelectNetworks,
  onSelectBaseNetwork,
  showTestnets = true,
  className,
}: NetworkSelectorProps) {
  const filteredNetworks = networks.filter(
    (n) => showTestnets || !n.isTestnet
  );

  const handleSingleSelect = (networkId: string) => {
    if (onSelectNetwork) {
      onSelectNetwork(networkId);
    }
  };

  const handleMultiSelect = (networkId: string, checked: boolean) => {
    if (onSelectNetworks) {
      if (checked) {
        onSelectNetworks([...selectedNetworks, networkId]);
      } else {
        onSelectNetworks(selectedNetworks.filter((id) => id !== networkId));
      }
    }
  };

  const handleBaseSelect = (networkId: string) => {
    if (onSelectBaseNetwork) {
      onSelectBaseNetwork(networkId);
    }
  };

  if (mode === 'single') {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-3', className)}>
        {filteredNetworks.map((network) => (
          <Card
            key={network.id}
            className={cn(
              'relative p-3 cursor-pointer transition-all duration-200',
              'hover:border-primary/50',
              selectedNetwork === network.id && 'border-primary bg-primary/5',
              (!network.supported || network.comingSoon) && 'opacity-60 cursor-not-allowed'
            )}
            onClick={() => network.supported && !network.comingSoon && handleSingleSelect(network.id)}
          >
            {selectedNetwork === network.id && (
              <div className="absolute top-2 right-2">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{network.icon}</span>
              <span className="font-medium text-sm">{network.name}</span>
            </div>

            <div className="flex gap-1 flex-wrap">
              {network.isTestnet && (
                <Badge variant="outline" className="text-[10px] px-1">
                  Testnet
                </Badge>
              )}
              {network.comingSoon && (
                <Badge variant="secondary" className="text-[10px] px-1">
                  Soon
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Multi-select mode
  return (
    <div className={cn('space-y-4', className)}>
      {/* Base network selection */}
      {onSelectBaseNetwork && (
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">
            Base Chain (Primary Deployment)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredNetworks
              .filter((n) => n.supported && !n.comingSoon)
              .map((network) => (
                <Card
                  key={network.id}
                  className={cn(
                    'relative p-3 cursor-pointer transition-all duration-200',
                    'hover:border-primary/50',
                    baseNetwork === network.id && 'border-primary bg-primary/5'
                  )}
                  onClick={() => handleBaseSelect(network.id)}
                >
                  {baseNetwork === network.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-xl">{network.icon}</span>
                    <span className="font-medium text-sm">{network.name}</span>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Additional networks selection */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Additional Chains (Multi-Chain Deployment)
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredNetworks
            .filter((n) => n.id !== baseNetwork)
            .map((network) => (
              <Card
                key={network.id}
                className={cn(
                  'p-3 transition-all duration-200',
                  selectedNetworks.includes(network.id) && 'border-primary/50 bg-primary/5',
                  (!network.supported || network.comingSoon) && 'opacity-60'
                )}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`network-${network.id}`}
                    checked={selectedNetworks.includes(network.id)}
                    onCheckedChange={(checked: boolean | 'indeterminate') => 
                      network.supported && !network.comingSoon && 
                      handleMultiSelect(network.id, checked === true)
                    }
                    disabled={!network.supported || network.comingSoon}
                  />
                  <Label 
                    htmlFor={`network-${network.id}`}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <span className="text-lg">{network.icon}</span>
                    <span className="font-medium text-sm">{network.name}</span>
                    {network.isTestnet && (
                      <Badge variant="outline" className="text-[10px] px-1">
                        Testnet
                      </Badge>
                    )}
                    {network.comingSoon && (
                      <Badge variant="secondary" className="text-[10px] px-1">
                        Soon
                      </Badge>
                    )}
                  </Label>
                </div>
              </Card>
            ))}
        </div>
      </div>

      {/* Summary */}
      {selectedNetworks.length > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4" />
            <span>
              Deploying to {1 + selectedNetworks.length} chain(s):{' '}
              <span className="font-medium">
                {[baseNetwork, ...selectedNetworks]
                  .map((id) => networks.find((n) => n.id === id)?.name)
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkSelector;
