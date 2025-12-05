import { describe, it, expect } from 'vitest';
import {
  PLATFORM_FEE_BPS,
  GAS_MULTIPLIERS,
  GAS_UNITS,
  calculatePlatformFee,
  getPlatformFeePercent,
  estimateGasCost,
  calculatePriceImpact,
  calculateMinReceived,
  calculateTrade,
  formatTradeNumber,
  validateTradeAmount,
} from '../trading-calculations';

describe('Trading Calculations', () => {
  describe('Constants', () => {
    it('should have correct platform fee basis points', () => {
      expect(PLATFORM_FEE_BPS).toBe(100); // 1%
    });

    it('should have gas multipliers for known chains', () => {
      expect(GAS_MULTIPLIERS[1]).toBe(1.2); // Ethereum
      expect(GAS_MULTIPLIERS[8453]).toBe(1.1); // Base
      expect(GAS_MULTIPLIERS[42161]).toBe(1.15); // Arbitrum
    });

    it('should have correct gas units', () => {
      expect(GAS_UNITS.BUY).toBe(BigInt(150000));
      expect(GAS_UNITS.SELL).toBe(BigInt(120000));
      expect(GAS_UNITS.APPROVE).toBe(BigInt(50000));
    });
  });

  describe('calculatePlatformFee', () => {
    it('should calculate 1% fee correctly', () => {
      expect(calculatePlatformFee(100)).toBe(1);
      expect(calculatePlatformFee(1000)).toBe(10);
      expect(calculatePlatformFee(0.5)).toBeCloseTo(0.005);
    });

    it('should return 0 for 0 amount', () => {
      expect(calculatePlatformFee(0)).toBe(0);
    });

    it('should handle small amounts', () => {
      expect(calculatePlatformFee(0.001)).toBeCloseTo(0.00001);
    });
  });

  describe('getPlatformFeePercent', () => {
    it('should return correct percentage as decimal', () => {
      expect(getPlatformFeePercent()).toBe(0.01); // 1%
    });
  });

  describe('estimateGasCost', () => {
    const mockGasPrice = BigInt(20000000000); // 20 gwei

    it('should calculate buy gas cost correctly', () => {
      const result = estimateGasCost('buy', mockGasPrice, 1); // Ethereum
      expect(result.gasWei).toBeGreaterThan(BigInt(0));
      expect(result.gasEth).toBeGreaterThan(0);
    });

    it('should calculate sell gas cost correctly', () => {
      const result = estimateGasCost('sell', mockGasPrice, 1);
      expect(result.gasWei).toBeGreaterThan(BigInt(0));
    });

    it('should apply chain-specific gas multiplier', () => {
      const ethResult = estimateGasCost('buy', mockGasPrice, 1); // 1.2x
      const baseResult = estimateGasCost('buy', mockGasPrice, 8453); // 1.1x
      
      // Ethereum should have higher gas due to higher multiplier
      expect(ethResult.gasWei).toBeGreaterThan(baseResult.gasWei);
    });

    it('should use default multiplier for unknown chains', () => {
      const result = estimateGasCost('buy', mockGasPrice, 999999);
      expect(result.gasWei).toBeGreaterThan(BigInt(0));
    });

    it('should use fallback gas price when null', () => {
      const result = estimateGasCost('buy', null, 1);
      expect(result.gasWei).toBeGreaterThan(BigInt(0));
    });

    it('buy should cost more gas than sell', () => {
      const buyResult = estimateGasCost('buy', mockGasPrice, 1);
      const sellResult = estimateGasCost('sell', mockGasPrice, 1);
      
      expect(buyResult.gasWei).toBeGreaterThan(sellResult.gasWei);
    });
  });

  describe('calculatePriceImpact', () => {
    it('should calculate price impact as percentage of liquidity', () => {
      expect(calculatePriceImpact(1000, 100000)).toBe(1); // 1%
      expect(calculatePriceImpact(5000, 100000)).toBe(5); // 5%
    });

    it('should return 0 for 0 liquidity', () => {
      expect(calculatePriceImpact(100, 0)).toBe(0);
    });

    it('should handle small trades', () => {
      expect(calculatePriceImpact(10, 100000)).toBe(0.01); // 0.01%
    });
  });

  describe('calculateMinReceived', () => {
    it('should apply slippage correctly', () => {
      expect(calculateMinReceived(100, 1)).toBe(99); // 1% slippage
      expect(calculateMinReceived(100, 0.5)).toBe(99.5); // 0.5% slippage
      expect(calculateMinReceived(100, 3)).toBe(97); // 3% slippage
    });

    it('should return full amount for 0 slippage', () => {
      expect(calculateMinReceived(100, 0)).toBe(100);
    });
  });

  describe('calculateTrade', () => {
    const baseInput = {
      inputAmount: 1, // 1 ETH
      tokenPrice: 0.0001, // 0.0001 ETH per token
      chainId: 1,
      gasPrice: BigInt(20000000000),
      liquidity: 100,
    };

    describe('buy trades', () => {
      it('should calculate tokens received correctly', () => {
        const result = calculateTrade({ ...baseInput, tradeType: 'buy' });
        
        // 1 ETH / 0.0001 = 10000 tokens
        expect(result.outputAmount).toBe(10000);
      });

      it('should include platform fee in total cost', () => {
        const result = calculateTrade({ ...baseInput, tradeType: 'buy' });
        
        expect(result.platformFee).toBeCloseTo(0.01); // 1% of 1 ETH
        expect(result.totalCost).toBeGreaterThan(result.inputAmount);
      });

      it('should calculate price impact', () => {
        const result = calculateTrade({ ...baseInput, tradeType: 'buy' });
        
        expect(result.priceImpact).toBe(1); // 1 ETH / 100 liquidity = 1%
      });
    });

    describe('sell trades', () => {
      it('should calculate ETH received correctly', () => {
        const result = calculateTrade({ 
          ...baseInput, 
          inputAmount: 10000, // 10000 tokens
          tradeType: 'sell' 
        });
        
        // 10000 tokens * 0.0001 = 1 ETH before fees
        const grossEth = 10000 * 0.0001;
        const fee = grossEth * 0.01; // 1% fee
        expect(result.outputAmount).toBeCloseTo(grossEth - fee);
      });

      it('should deduct platform fee from received amount', () => {
        const result = calculateTrade({
          ...baseInput,
          inputAmount: 10000,
          tradeType: 'sell'
        });
        
        expect(result.platformFee).toBeCloseTo(0.01); // 1% of 1 ETH
      });

      it('should only include gas in total cost for sell', () => {
        const result = calculateTrade({
          ...baseInput,
          inputAmount: 10000,
          tradeType: 'sell'
        });
        
        expect(result.totalCost).toBe(result.estimatedGasEth);
      });
    });
  });

  describe('formatTradeNumber', () => {
    it('should format billions', () => {
      expect(formatTradeNumber(1500000000)).toBe('1.50B');
    });

    it('should format millions', () => {
      expect(formatTradeNumber(2500000)).toBe('2.50M');
    });

    it('should format thousands', () => {
      expect(formatTradeNumber(5500)).toBe('5.50K');
    });

    it('should format small numbers with decimals', () => {
      expect(formatTradeNumber(0.123456)).toBe('0.123456');
    });

    it('should respect custom decimal places', () => {
      expect(formatTradeNumber(0.123456789, 4)).toBe('0.1235');
    });
  });

  describe('validateTradeAmount', () => {
    it('should validate positive amount within balance', () => {
      const result = validateTradeAmount(50, 100);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject zero amount', () => {
      const result = validateTradeAmount(0, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid amount');
    });

    it('should reject negative amount', () => {
      const result = validateTradeAmount(-10, 100);
      expect(result.isValid).toBe(false);
    });

    it('should reject NaN', () => {
      const result = validateTradeAmount(NaN, 100);
      expect(result.isValid).toBe(false);
    });

    it('should reject amount exceeding balance', () => {
      const result = validateTradeAmount(150, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Insufficient balance');
    });

    it('should reject amount below minimum', () => {
      const result = validateTradeAmount(0.001, 100, 0.01);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Minimum amount is 0.01');
    });

    it('should accept amount equal to balance', () => {
      const result = validateTradeAmount(100, 100);
      expect(result.isValid).toBe(true);
    });
  });
});
