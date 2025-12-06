'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle,
  AlertCircle,
  Wallet,
  Loader2
} from 'lucide-react';

// Network configuration - Extended for BDAG, Solana, and all split networks
export interface NetworkConfig {
  id: string;
  name: string;
  chainId: number | null;
  icon: string;
  color: string;
  type: 'EVM' | 'SOLANA' | 'MOVE' | 'OTHER';
  isTestnet: boolean;
  isMainnet: boolean;
  isEnabledForBase: boolean;
  isEnabledForSplit: boolean;
  comingSoon?: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Default networks - will be overridden by API data
export const networks: NetworkConfig[] = [
  // ======== BASE NETWORKS ========
  {
    id: 'ETH_MAINNET',
    name: 'Ethereum',
    chainId: 1,
    icon: '⟠',
    color: '#627EEA',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: true,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'ETH_SEPOLIA',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    icon: '⟠',
    color: '#627EEA',
    type: 'EVM',
    isTestnet: true,
    isMainnet: false,
    isEnabledForBase: true,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'BDAG_MAINNET',
    name: 'BlockDAG',
    chainId: 1043,
    icon: '🔷',
    color: '#00D4FF',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: true,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'BDAG', symbol: 'BDAG', decimals: 18 },
  },
  {
    id: 'BDAG_TESTNET',
    name: 'BlockDAG Awakening',
    chainId: 1043,
    icon: '🔷',
    color: '#00D4FF',
    type: 'EVM',
    isTestnet: true,
    isMainnet: false,
    isEnabledForBase: true,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'BDAG', symbol: 'BDAG', decimals: 18 },
  },
  {
    id: 'SOLANA_MAINNET',
    name: 'Solana',
    chainId: null,
    icon: '◎',
    color: '#9945FF',
    type: 'SOLANA',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: true,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  },
  {
    id: 'SOLANA_DEVNET',
    name: 'Solana Devnet',
    chainId: null,
    icon: '◎',
    color: '#9945FF',
    type: 'SOLANA',
    isTestnet: true,
    isMainnet: false,
    isEnabledForBase: true,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  },
  // ======== SPLIT NETWORKS (Wave 1) ========
  {
    id: 'ARBITRUM_ONE',
    name: 'Arbitrum One',
    chainId: 42161,
    icon: '🔵',
    color: '#28A0F0',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: false,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'BASE_MAINNET',
    name: 'Base',
    chainId: 8453,
    icon: '🔵',
    color: '#0052FF',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: false,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'OPTIMISM_MAINNET',
    name: 'Optimism',
    chainId: 10,
    icon: '🔴',
    color: '#FF0420',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: false,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'BNB_MAINNET',
    name: 'BNB Chain',
    chainId: 56,
    icon: '🟡',
    color: '#F0B90B',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: false,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
  {
    id: 'POLYGON_MAINNET',
    name: 'Polygon',
    chainId: 137,
    icon: '💜',
    color: '#8247E5',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: false,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  {
    id: 'AVALANCHE_MAINNET',
    name: 'Avalanche',
    chainId: 43114,
    icon: '🔺',
    color: '#E84142',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: false,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
  },
  // ======== SPLIT NETWORKS (Wave 2) ========
  {
    id: 'ZKSYNC_MAINNET',
    name: 'zkSync Era',
    chainId: 324,
    icon: '⚡',
    color: '#8C8DFC',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: false,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'LINEA_MAINNET',
    name: 'Linea',
    chainId: 59144,
    icon: '➰',
    color: '#61DFFF',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: false,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'SEI_MAINNET',
    name: 'Sei',
    chainId: 1329,
    icon: '🌊',
    color: '#9B1C1C',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: false,
    isEnabledForSplit: true,
    nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  },
  {
    id: 'HYPER_EVM',
    name: 'Hyper EVM',
    chainId: 999,
    icon: '🚀',
    color: '#00FF00',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: false,
    isEnabledForSplit: false,
    comingSoon: true,
    nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  },
  {
    id: 'MONAD_MAINNET',
    name: 'Monad',
    chainId: null,
    icon: '🟣',
    color: '#7B3FE4',
    type: 'EVM',
    isTestnet: false,
    isMainnet: true,
    isEnabledForBase: false,
    isEnabledForSplit: false,
    comingSoon: true,
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
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
              (!network.isEnabledForBase || network.comingSoon) && 'opacity-60 cursor-not-allowed'
            )}
            onClick={() => network.isEnabledForBase && !network.comingSoon && handleSingleSelect(network.id)}
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
              .filter((n) => n.isEnabledForBase && !n.comingSoon)
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
                  (!network.isEnabledForSplit || network.comingSoon) && 'opacity-60'
                )}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`network-${network.id}`}
                    checked={selectedNetworks.includes(network.id)}
                    onCheckedChange={(checked: boolean | 'indeterminate') => 
                      network.isEnabledForSplit && !network.comingSoon && 
                      handleMultiSelect(network.id, checked === true)
                    }
                    disabled={!network.isEnabledForSplit || network.comingSoon}
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
