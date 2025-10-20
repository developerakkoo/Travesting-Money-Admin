import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { StockIdea, ModifiedFlags, TradeAction } from './models';

@Injectable({
  providedIn: 'root',
})
export class StockIdeaStore {
  // Signals for reactive state
  private _currentIdea = signal<StockIdea | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _modifiedFlags = signal<ModifiedFlags>({
    stoplossChanged: false,
    targetPriceChanged: false,
    durationChanged: false,
  });

  // Public readonly signals
  readonly currentIdea = this._currentIdea.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly modifiedFlags = this._modifiedFlags.asReadonly();

  // Computed signals
  readonly isOutsideBuyZone = computed(() => {
    const idea = this._currentIdea();
    if (!idea || !idea.cmp || !idea.entryRangeMin || !idea.entryRangeMax) {
      return false;
    }
    return idea.cmp < idea.entryRangeMin || idea.cmp > idea.entryRangeMax;
  });

  readonly recentUpdates = computed(() => {
    const idea = this._currentIdea();
    if (!idea || !idea.actions || idea.actions.length === 0) {
      return [];
    }

    // Sort by date descending and take last 3
    return idea.actions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  });

  readonly isPublished = computed(() => {
    const idea = this._currentIdea();
    return idea ? !!idea.postedAt : false;
  });

  readonly returnsSoFar = computed(() => {
    const idea = this._currentIdea();
    if (!idea || !idea.changePct) {
      return null;
    }
    return idea.changePct;
  });

  readonly potentialLeft = computed(() => {
    const idea = this._currentIdea();
    if (!idea || !idea.potentialLeftPct) {
      return null;
    }
    return idea.potentialLeftPct;
  });

  // Observable streams for complex derived state
  private _state$ = new BehaviorSubject({
    currentIdea: null as StockIdea | null,
    loading: false,
    error: null as string | null,
    modifiedFlags: {
      stoplossChanged: false,
      targetPriceChanged: false,
      durationChanged: false,
    } as ModifiedFlags,
  });

  readonly state$ = this._state$.asObservable().pipe(distinctUntilChanged());

  // Actions
  setCurrentIdea(idea: StockIdea | null): void {
    this._currentIdea.set(idea);
    this.updateState();
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
    this.updateState();
  }

  setError(error: string | null): void {
    this._error.set(error);
    this.updateState();
  }

  setModifiedFlags(flags: ModifiedFlags): void {
    this._modifiedFlags.set(flags);
    this.updateState();
  }

  updateIdeaField<K extends keyof StockIdea>(
    field: K,
    value: StockIdea[K]
  ): void {
    const currentIdea = this._currentIdea();
    if (currentIdea) {
      const updatedIdea = { ...currentIdea, [field]: value };
      this._currentIdea.set(updatedIdea);
      this.updateState();
    }
  }

  addAction(action: TradeAction): void {
    const currentIdea = this._currentIdea();
    if (currentIdea) {
      const updatedActions = [...currentIdea.actions, action];
      this.updateIdeaField('actions', updatedActions);
    }
  }

  removeAction(actionId: string): void {
    const currentIdea = this._currentIdea();
    if (currentIdea) {
      const updatedActions = currentIdea.actions.filter(
        (a) => a.id !== actionId
      );
      this.updateIdeaField('actions', updatedActions);
    }
  }

  addAlert(alert: string): void {
    const currentIdea = this._currentIdea();
    if (currentIdea) {
      const updatedAlerts = [...(currentIdea.alerts || []), alert];
      this.updateIdeaField('alerts', updatedAlerts);
    }
  }

  removeAlert(index: number): void {
    const currentIdea = this._currentIdea();
    if (currentIdea && currentIdea.alerts) {
      const updatedAlerts = currentIdea.alerts.filter((_, i) => i !== index);
      this.updateIdeaField('alerts', updatedAlerts);
    }
  }

  clearError(): void {
    this._error.set(null);
    this.updateState();
  }

  reset(): void {
    this._currentIdea.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._modifiedFlags.set({
      stoplossChanged: false,
      targetPriceChanged: false,
      durationChanged: false,
    });
    this.updateState();
  }

  private updateState(): void {
    this._state$.next({
      currentIdea: this._currentIdea(),
      loading: this._loading(),
      error: this._error(),
      modifiedFlags: this._modifiedFlags(),
    });
  }

  // Selectors for specific state slices
  getCurrentIdea$(): Observable<StockIdea | null> {
    return this.state$.pipe(map((state) => state.currentIdea));
  }

  getLoading$(): Observable<boolean> {
    return this.state$.pipe(map((state) => state.loading));
  }

  getError$(): Observable<string | null> {
    return this.state$.pipe(map((state) => state.error));
  }

  getModifiedFlags$(): Observable<ModifiedFlags> {
    return this.state$.pipe(map((state) => state.modifiedFlags));
  }

  getIsOutsideBuyZone$(): Observable<boolean> {
    return this.state$.pipe(
      map((state) => {
        const idea = state.currentIdea;
        if (!idea || !idea.cmp || !idea.entryRangeMin || !idea.entryRangeMax) {
          return false;
        }
        return idea.cmp < idea.entryRangeMin || idea.cmp > idea.entryRangeMax;
      })
    );
  }

  getRecentUpdates$(): Observable<TradeAction[]> {
    return this.state$.pipe(
      map((state) => {
        const idea = state.currentIdea;
        if (!idea || !idea.actions || idea.actions.length === 0) {
          return [];
        }

        return idea.actions
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 3);
      })
    );
  }
}
