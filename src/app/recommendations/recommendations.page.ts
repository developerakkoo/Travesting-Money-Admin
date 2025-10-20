import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import {
  AlertController,
  LoadingController,
  ToastController,
  ModalController,
} from '@ionic/angular';
import {
  UserService,
  User,
  StockRecommendation,
  TradeAction,
} from '../services/user.service';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.page.html',
  styleUrls: ['./recommendations.page.scss'],
  standalone: false,
})
export class RecommendationsPage implements OnInit {
  users: User[] = [];
  allRecommendations: StockRecommendation[] = [];
  filteredRecommendations: StockRecommendation[] = [];

  // Filters
  searchTerm = '';
  selectedUser: string = '';
  selectedSubscription: string = '';
  selectedRecommendationType: string = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Edit Modal
  isEditModalOpen = false;
  selectedRecommendation: StockRecommendation | null = null;
  editedRecommendation: Partial<StockRecommendation> = {};

  constructor(
    private userService: UserService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private modalController: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadAllRecommendations();
  }

  async loadUsers() {
    try {
      const usersData = (await this.userService
        .getUsers()
        .pipe(take(1))
        .toPromise()) as User[];

      this.users = usersData || [];

      // Ensure all users have proper array for purchasedSubscriptions
      this.users = this.users.map((user) => ({
        ...user,
        purchasedSubscriptions: Array.isArray(user.purchasedSubscriptions)
          ? user.purchasedSubscriptions
          : [],
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      await this.presentToast('Failed to load users', 'danger');
      this.users = []; // Ensure users is always an array
    }
  }

  async loadAllRecommendations() {
    try {
      this.allRecommendations =
        await this.userService.getStockRecommendations();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading recommendations:', error);
      await this.presentToast('Failed to load recommendations', 'danger');
      // Fallback to empty array
      this.allRecommendations = [];
      this.applyFilters();
    }
  }

  applyFilters() {
    let filtered = [...this.allRecommendations];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (rec) =>
          rec.stockSymbol.toLowerCase().includes(term) ||
          rec.stockName.toLowerCase().includes(term) ||
          rec.reason.toLowerCase().includes(term)
      );
    }

    // User filter
    if (this.selectedUser) {
      filtered = filtered.filter((rec) => rec.userId === this.selectedUser);
    }

    // Subscription filter
    if (this.selectedSubscription) {
      const usersWithSubscription = this.users.filter((user) =>
        user.purchasedSubscriptions.includes(this.selectedSubscription)
      );
      const userIds = usersWithSubscription.map((user) => user.uid);
      filtered = filtered.filter((rec) => userIds.includes(rec.userId));
    }

    // Recommendation type filter
    if (this.selectedRecommendationType) {
      filtered = filtered.filter(
        (rec) => rec.recommendation === this.selectedRecommendationType
      );
    }

    this.filteredRecommendations = filtered;
    this.currentPage = 1; // Reset to first page
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedUser = '';
    this.selectedSubscription = '';
    this.selectedRecommendationType = '';
    this.applyFilters();
  }

  getUserName(userId: string): string {
    const user = this.users.find((u) => u.uid === userId);
    return user ? user.name : 'Unknown User';
  }

  getUserSubscriptions(userId: string): string[] {
    const user = this.users.find((u) => u.uid === userId);
    if (!user || !user.purchasedSubscriptions) {
      return [];
    }
    // Ensure it's an array
    return Array.isArray(user.purchasedSubscriptions)
      ? user.purchasedSubscriptions
      : [];
  }

  getRecommendationCount(type: 'BUY' | 'SELL'): number {
    return this.filteredRecommendations.filter(
      (rec) => rec.recommendation === type
    ).length;
  }

  getTotalRecommendations(): number {
    return this.filteredRecommendations.length;
  }

  async deleteRecommendation(recommendation: StockRecommendation) {
    const alert = await this.alertController.create({
      header: 'Delete Recommendation',
      message: `Are you sure you want to delete the ${recommendation.recommendation} recommendation for ${recommendation.stockSymbol}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.performDeleteRecommendation(recommendation);
          },
        },
      ],
    });

    await alert.present();
  }

  private async performDeleteRecommendation(
    recommendation: StockRecommendation
  ) {
    const loading = await this.loadingController.create({
      message: 'Deleting recommendation...',
    });
    await loading.present();

    try {
      // Delete from Firestore
      await this.userService.deleteStockRecommendation(recommendation.id!);

      // Remove from local arrays
      this.allRecommendations = this.allRecommendations.filter(
        (rec) => rec.id !== recommendation.id
      );
      this.filteredRecommendations = this.filteredRecommendations.filter(
        (rec) => rec.id !== recommendation.id
      );

      await loading.dismiss();
      await this.presentToast('Recommendation deleted successfully', 'success');
    } catch (error) {
      await loading.dismiss();
      await this.presentToast('Failed to delete recommendation', 'danger');
    }
  }

  async presentToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 3000,
    });
    await toast.present();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getSubscriptionBadgeColor(subscription: string) {
    switch (subscription) {
      case 'wealth-builder':
        return 'success';
      case 'premium':
        return 'warning';
      case 'basic':
        return 'primary';
      default:
        return 'medium';
    }
  }

  // Pagination methods
  getPaginatedRecommendations(): StockRecommendation[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredRecommendations.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredRecommendations.length / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  openStockRecommendationEditor() {
    this.router.navigate(['/admin/stock-ideas/new']);
  }

  trackBySubscription(index: number, subscription: string): string {
    return subscription;
  }

  // Edit Recommendation Methods
  openEditModal(recommendation: StockRecommendation) {
    this.selectedRecommendation = recommendation;
    this.editedRecommendation = {
      ...recommendation,
      actions: [...(recommendation.actions || [])],
      alerts: [...(recommendation.alerts || [])],
    };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedRecommendation = null;
    this.editedRecommendation = {};
  }

  async updateRecommendation() {
    if (!this.selectedRecommendation?.id) {
      await this.presentToast('No recommendation selected', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Updating recommendation...',
    });
    await loading.present();

    try {
      // Prepare the update data
      const updateData: Partial<StockRecommendation> = {
        stockSymbol: this.editedRecommendation.stockSymbol,
        stockName: this.editedRecommendation.stockName,
        stockExchange: this.editedRecommendation.stockExchange,
        term: this.editedRecommendation.term,
        recommendation: this.editedRecommendation.recommendation,
        cmp: this.editedRecommendation.cmp,
        changePct: this.editedRecommendation.changePct,
        date: this.editedRecommendation.date,
        currentPrice: this.editedRecommendation.currentPrice,
        targetPrice: this.editedRecommendation.targetPrice,
        entryPrice: this.editedRecommendation.entryPrice,
        entryRangeMin: this.editedRecommendation.entryRangeMin,
        entryRangeMax: this.editedRecommendation.entryRangeMax,
        stoploss: this.editedRecommendation.stoploss,
        potentialLeftPct: this.editedRecommendation.potentialLeftPct,
        durationText: this.editedRecommendation.durationText,
        actions: this.editedRecommendation.actions,
        alerts: this.editedRecommendation.alerts,
        reason: this.editedRecommendation.reason,
      };

      // Update in Firestore
      await this.userService.updateStockRecommendation(
        this.selectedRecommendation.id,
        updateData
      );

      // Reload recommendations
      await this.loadAllRecommendations();

      await loading.dismiss();
      this.closeEditModal();
      await this.presentToast('Recommendation updated successfully', 'success');
    } catch (error) {
      await loading.dismiss();
      console.error('Error updating recommendation:', error);
      await this.presentToast(
        'Failed to update recommendation: ' + (error as Error).message,
        'danger'
      );
    }
  }

  // Action Management Methods
  addNewAction() {
    if (!this.editedRecommendation.actions) {
      this.editedRecommendation.actions = [];
    }

    const newAction: TradeAction = {
      id: this.generateActionId(),
      type: 'AVERAGING',
      date: new Date().toISOString().split('T')[0],
      entryPrice: this.editedRecommendation.currentPrice || 0,
      entryRangeMin: (this.editedRecommendation.currentPrice || 0) * 0.95,
      entryRangeMax: (this.editedRecommendation.currentPrice || 0) * 1.05,
      note: '',
    };

    this.editedRecommendation.actions.push(newAction);
  }

  removeAction(index: number) {
    if (this.editedRecommendation.actions) {
      this.editedRecommendation.actions.splice(index, 1);
    }
  }

  // Alert Management Methods
  async addNewAlert() {
    const alert = await this.alertController.create({
      header: 'Add Alert',
      inputs: [
        {
          name: 'alertText',
          type: 'text',
          placeholder: 'Enter alert message',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Add',
          handler: (data) => {
            if (data.alertText && data.alertText.trim()) {
              if (!this.editedRecommendation.alerts) {
                this.editedRecommendation.alerts = [];
              }
              this.editedRecommendation.alerts.push(data.alertText.trim());
            }
          },
        },
      ],
    });

    await alert.present();
  }

  removeAlert(index: number) {
    if (this.editedRecommendation.alerts) {
      this.editedRecommendation.alerts.splice(index, 1);
    }
  }

  private generateActionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Helper methods for display
  getActionTypeLabel(type: string): string {
    return type === 'AVERAGING' ? 'Averaging' : 'Partial Booking';
  }

  getActionBadgeColor(type: string): string {
    return type === 'AVERAGING' ? 'primary' : 'success';
  }

  calculatePotentialPct() {
    const currentPrice = this.editedRecommendation.currentPrice || 0;
    const targetPrice = this.editedRecommendation.targetPrice || 0;

    if (currentPrice > 0 && targetPrice > 0) {
      this.editedRecommendation.potentialLeftPct =
        ((targetPrice - currentPrice) / currentPrice) * 100;
    }
  }
}
