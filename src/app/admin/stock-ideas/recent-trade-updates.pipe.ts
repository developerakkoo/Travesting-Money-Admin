import { Pipe, PipeTransform } from '@angular/core';
import { TradeAction, TradeActionType } from './models';

@Pipe({
  name: 'recentTradeUpdates',
  standalone: true,
})
export class RecentTradeUpdatesPipe implements PipeTransform {
  transform(actions: TradeAction[]): string[] {
    if (!actions || actions.length === 0) {
      return [];
    }

    // Sort by date descending and take last 3
    const sortedActions = actions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    return sortedActions.map((action) => this.formatAction(action));
  }

  private formatAction(action: TradeAction): string {
    const date = new Date(action.date);
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });

    switch (action.type) {
      case 'AVERAGING':
        return `Averaging @ ${action.entryPrice} on ${formattedDate}`;

      case 'PARTIAL_BOOKING':
        return `Partial booking @ ${action.entryPrice} on ${formattedDate}`;

      case 'ADD_ALERT':
        return `Alert added @ ${action.entryPrice} on ${formattedDate}`;

      default:
        return `${action.type} @ ${action.entryPrice} on ${formattedDate}`;
    }
  }
}
