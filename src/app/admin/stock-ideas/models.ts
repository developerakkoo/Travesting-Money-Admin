export type Term = 'short' | 'mid' | 'long';
export type TradeActionType = 'AVERAGING' | 'PARTIAL_BOOKING' | 'ADD_ALERT';

export interface TradeAction {
  id?: string;
  type: TradeActionType;
  date: string; // ISO date
  entryPrice: number;
  entryRangeMin?: number;
  entryRangeMax?: number;
  note?: string;
  createdAt?: string;
}

export interface StockIdea {
  id?: string;
  symbol: string;
  stockName: string;
  stockExchange?: 'NSE' | 'BSE'; // Stock Exchange
  term: Term; // short/mid/long
  action: 'BUY' | 'SELL';
  postedAt?: string; // publish timestamp
  cmp?: number;
  changePct?: number;
  potentialLeftPct?: number;

  date: string; // main idea date (ISO)
  entryPrice: number;
  entryRangeMin?: number;
  entryRangeMax?: number;

  targetHit: boolean;
  stoplossHit: boolean;
  profitEarned: number;
  isMarkedForDeletion: boolean;
  stoploss: number;
  targetPrice: number;
  durationText: string; // e.g., "1-3 months"

  actions: TradeAction[]; // dynamic rows (averaging/partial booking etc.)
  alerts?: string[];

  // File upload fields
  imageUrl?: string; // URL of the uploaded stock image
  researchReportUrl?: string; // URL of the uploaded research report

  createdAt?: string;
  updatedAt?: string;

  // for UI: baseline snapshot taken on publish to detect per-field modification
  baseline?: Partial<
    Pick<StockIdea, 'stoploss' | 'targetPrice' | 'durationText'>
  >;
}

export interface ModifiedFlags {
  stoplossChanged: boolean;
  targetPriceChanged: boolean;
  durationChanged: boolean;
}

export interface StockIdeaFormData {
  symbol: string;
  stockName: string;
  term: Term;
  action: 'BUY' | 'SELL';
  date: string;
  entryPrice: number;
  entryRangeMin?: number;
  entryRangeMax?: number;
  stoploss: number;
  targetPrice: number;
  durationText: string;
  actions: TradeAction[];
  alerts: string[];
  imageUrl?: string;
  researchReportUrl?: string;
}

export interface StockIdeaState {
  currentIdea: StockIdea | null;
  loading: boolean;
  error: string | null;
  modifiedFlags: ModifiedFlags;
}
