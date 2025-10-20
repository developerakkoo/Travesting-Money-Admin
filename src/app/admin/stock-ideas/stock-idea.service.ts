import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { StockIdea, TradeAction, ModifiedFlags } from './models';

@Injectable({
  providedIn: 'root',
})
export class StockIdeaService {
  private readonly STORAGE_KEY = 'stock_ideas';
  private readonly BASELINE_KEY = 'stock_idea_baselines';

  constructor() {}

  // Mock data for testing
  private getMockData(): StockIdea {
    return {
      id: 'new',
      symbol: 'XXXX',
      stockName: 'Sample Co.',
      term: 'mid',
      action: 'BUY',
      postedAt: undefined,
      cmp: 2565,
      changePct: 2.5,
      potentialLeftPct: 15.2,
      date: new Date().toISOString(),
      entryPrice: 2569,
      entryRangeMin: 2550,
      entryRangeMax: 2575,
      stoploss: 2550,
      targetPrice: 2590,
      durationText: '1-3 months',
      actions: [
        {
          id: '1',
          type: 'AVERAGING',
          date: new Date().toISOString(),
          entryPrice: 2560,
          note: 'First averaging position',
        },
      ],
      alerts: [],
      createdAt: new Date().toISOString(),
    };
  }

  getById(id: string): Observable<StockIdea> {
    if (id === 'new') {
      return of(this.getMockData()).pipe(delay(500));
    }

    try {
      const ideas = this.getStoredIdeas();
      const idea = ideas.find((i) => i.id === id);

      if (!idea) {
        return throwError(() => new Error('Stock idea not found'));
      }

      return of(idea).pipe(delay(500));
    } catch (error) {
      return throwError(() => error);
    }
  }

  create(payload: Partial<StockIdea>): Observable<StockIdea> {
    const newIdea: StockIdea = {
      id: this.generateId(),
      symbol: payload.symbol || '',
      stockName: payload.stockName || '',
      term: payload.term || 'mid',
      action: payload.action || 'BUY',
      date: payload.date || new Date().toISOString(),
      entryPrice: payload.entryPrice || 0,
      entryRangeMin: payload.entryRangeMin,
      entryRangeMax: payload.entryRangeMax,
      stoploss: payload.stoploss || 0,
      targetPrice: payload.targetPrice || 0,
      durationText: payload.durationText || '',
      actions: payload.actions || [],
      alerts: payload.alerts || [],
      cmp: payload.cmp,
      changePct: payload.changePct,
      potentialLeftPct: payload.potentialLeftPct,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.saveIdea(newIdea).pipe(
      tap(() => console.log('Stock idea created:', newIdea))
    );
  }

  update(id: string, payload: Partial<StockIdea>): Observable<StockIdea> {
    try {
      const ideas = this.getStoredIdeas();
      const ideaIndex = ideas.findIndex((i) => i.id === id);

      if (ideaIndex === -1) {
        return throwError(() => new Error('Stock idea not found'));
      }

      const updatedIdea: StockIdea = {
        ...ideas[ideaIndex],
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
      };

      ideas[ideaIndex] = updatedIdea;
      this.setStoredIdeas(ideas);

      return of(updatedIdea).pipe(
        delay(500),
        tap(() => console.log('Stock idea updated:', updatedIdea))
      );
    } catch (error) {
      return throwError(() => error);
    }
  }

  publish(id: string): Observable<StockIdea> {
    try {
      const ideas = this.getStoredIdeas();
      const ideaIndex = ideas.findIndex((i) => i.id === id);

      if (ideaIndex === -1) {
        return throwError(() => new Error('Stock idea not found'));
      }

      const idea = ideas[ideaIndex];

      if (idea.postedAt) {
        return throwError(() => new Error('Stock idea already published'));
      }

      // Set postedAt and create baseline
      const publishedIdea: StockIdea = {
        ...idea,
        postedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        baseline: {
          stoploss: idea.stoploss,
          targetPrice: idea.targetPrice,
          durationText: idea.durationText,
        },
      };

      ideas[ideaIndex] = publishedIdea;
      this.setStoredIdeas(ideas);

      // Store baseline separately for diff computation
      this.storeBaseline(id, publishedIdea.baseline!);

      return of(publishedIdea).pipe(
        delay(500),
        tap(() => console.log('Stock idea published:', publishedIdea))
      );
    } catch (error) {
      return throwError(() => error);
    }
  }

  computeDiff(
    original: StockIdea['baseline'],
    current: StockIdea
  ): ModifiedFlags {
    if (!original) {
      return {
        stoplossChanged: false,
        targetPriceChanged: false,
        durationChanged: false,
      };
    }

    return {
      stoplossChanged: original.stoploss !== current.stoploss,
      targetPriceChanged: original.targetPrice !== current.targetPrice,
      durationChanged: original.durationText !== current.durationText,
    };
  }

  private saveIdea(idea: StockIdea): Observable<StockIdea> {
    try {
      const ideas = this.getStoredIdeas();
      ideas.push(idea);
      this.setStoredIdeas(ideas);
      return of(idea).pipe(delay(500));
    } catch (error) {
      return throwError(() => error);
    }
  }

  private getStoredIdeas(): StockIdea[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private setStoredIdeas(ideas: StockIdea[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ideas));
  }

  private storeBaseline(id: string, baseline: StockIdea['baseline']): void {
    const baselines = this.getStoredBaselines();
    baselines[id] = baseline;
    localStorage.setItem(this.BASELINE_KEY, JSON.stringify(baselines));
  }

  private getStoredBaselines(): Record<string, StockIdea['baseline']> {
    const stored = localStorage.getItem(this.BASELINE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
