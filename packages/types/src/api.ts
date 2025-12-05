// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationInput {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter types
export interface TokenFilters {
  status?: string[];
  launchMode?: string[];
  baseChainId?: string;
  creatorId?: string;
  search?: string;
}

// WebSocket event types
export interface WSEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

export interface PriceUpdateEvent {
  tokenId: string;
  price: string;
  volume24h: string;
  change24h: number;
}

export interface TradeEvent {
  tokenId: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  userAddress: string;
  txHash: string;
  timestamp: number;
}

export interface GraduationEvent {
  tokenId: string;
  status: string;
  progress: number;
  currentNetwork?: string;
  message?: string;
}

// Transaction types
export interface TransactionRequest {
  to: string;
  data: string;
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
}
