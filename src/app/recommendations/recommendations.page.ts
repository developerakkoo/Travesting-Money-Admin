import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import {
  AlertController,
  LoadingController,
  ToastController,
  ModalController,
  IonInput,
} from '@ionic/angular';
import {
  UserService,
  User,
  StockRecommendation,
  TradeAction,
} from '../services/user.service';
import { StorageService } from '../services/storage.service';

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

  // File upload
  @ViewChild('reportFileInput') reportFileInput!: ElementRef<HTMLInputElement>;
  isUploadingReport = false;
  @ViewChild('exitDateInput', { read: IonInput }) exitDateInput?: IonInput;
  @ViewChild('exitTimeInput', { read: IonInput }) exitTimeInput?: IonInput;

  constructor(
    private userService: UserService,
    private storageService: StorageService,
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
      header: 'Permanently Delete Recommendation',
      message: `⚠️ WARNING: This will permanently delete the ${recommendation.recommendation} recommendation for ${recommendation.stockSymbol} from the database. This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Permanently Delete',
          role: 'destructive',
          handler: () => {
            this.performDeleteRecommendation(recommendation);
          },
        },
      ],
    });

    await alert.present();
  }


  async performMarkAsDeletedRecommendation(recommendation: StockRecommendation) {
    const alert = await this.alertController.create({
      header: 'Hide Recommendation',
      message: `Please confirm the exit details for the ${recommendation.recommendation} recommendation on ${recommendation.stockSymbol}. These will be saved before the idea is hidden from the admin view.`,
      inputs: [
        {
          name: 'exitPrice',
          type: 'number',
          min: 0,
          placeholder: 'Exit Price (e.g., 1250)',
          value:
            recommendation.exitPrice !== undefined &&
            recommendation.exitPrice !== null
              ? String(recommendation.exitPrice)
              : '',
        },
        {
          name: 'exitDate',
          type: 'date',
          value: recommendation.exitDate || '',
        },
        {
          name: 'exitTime',
          type: 'time',
          value: recommendation.exitTime || '',
        },
        {
          name: 'profitEarned',
          type: 'text',
          placeholder: 'Profit Earned (e.g., +12% in 10 days)',
          value:
            recommendation.profitEarned !== undefined &&
            recommendation.profitEarned !== null
              ? String(recommendation.profitEarned)
              : '',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Hide',
          handler: (data) => {
            const exitPrice =
              data.exitPrice !== undefined && data.exitPrice !== null
                ? parseFloat(data.exitPrice)
                : NaN;
            const exitDate = data.exitDate;
            const exitTime = data.exitTime;
            const profitEarnedInput =
              data.profitEarned !== undefined && data.profitEarned !== null
                ? data.profitEarned.trim()
                : undefined;

            if (!data.exitPrice || isNaN(exitPrice) || exitPrice <= 0) {
              this.presentToast(
                'Please provide a valid exit price before hiding the recommendation.',
                'warning'
              );
              return false;
            }

            if (!exitDate) {
              this.presentToast(
                'Please provide the exit date before hiding the recommendation.',
                'warning'
              );
              return false;
            }

            if (!exitTime) {
              this.presentToast(
                'Please provide the exit time before hiding the recommendation.',
                'warning'
              );
              return false;
            }

            this.performMarkAsDeleted(recommendation, {
              exitPrice,
              exitDate,
              exitTime,
              profitEarned:
                profitEarnedInput && profitEarnedInput.length > 0
                  ? profitEarnedInput
                  : undefined,
            });
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  private async performMarkAsDeleted(
    recommendation: StockRecommendation,
    exitDetails: {
      exitPrice: number;
      exitDate: string;
      exitTime: string;
      profitEarned?: string;
    }
  ) {
    const loading = await this.loadingController.create({
      message: 'Hiding recommendation...',
    });
    await loading.present();
    try {
      await this.userService.markStockRecommendationForDeletion(
        recommendation.id!,
        exitDetails
      );

      recommendation.exitPrice = exitDetails.exitPrice;
      recommendation.exitDate = exitDetails.exitDate;
      recommendation.exitTime = exitDetails.exitTime;
      if (exitDetails.profitEarned !== undefined) {
        recommendation.profitEarned = exitDetails.profitEarned;
      }

      if (this.selectedRecommendation?.id === recommendation.id) {
        this.closeEditModal();
      }

      // Remove from local arrays
      this.allRecommendations = this.allRecommendations.filter(
        (rec) => rec.id !== recommendation.id
      );
      this.filteredRecommendations = this.filteredRecommendations.filter(
        (rec) => rec.id !== recommendation.id
      );

      await loading.dismiss();
      await this.presentToast('Recommendation hidden successfully', 'success');
    } catch (error) {
      console.error('Error marking recommendation for deletion:', error);
      await loading.dismiss();
      await this.presentToast('Failed to hide recommendation', 'danger');
    }
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
      researchReportUrl: recommendation.researchReportUrl, // Explicitly copy researchReportUrl
      // Ensure profitEarned is always a string (handle legacy data that might be number)
      profitEarned: recommendation.profitEarned !== undefined && recommendation.profitEarned !== null 
        ? String(recommendation.profitEarned) 
        : '',
    };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedRecommendation = null;
    this.editedRecommendation = {};
  }

  async openExitDatePicker() {
    await this.triggerNativePicker(this.exitDateInput);
  }

  async openExitTimePicker() {
    await this.triggerNativePicker(this.exitTimeInput);
  }

  private async triggerNativePicker(input?: IonInput) {
    if (!input) {
      return;
    }

    const nativeInput = await input.getInputElement();
    if (!nativeInput) {
      return;
    }

    const picker = (nativeInput as any).showPicker;
    if (typeof picker === 'function') {
      picker.call(nativeInput);
    } else {
      nativeInput.click();
    }
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
      // Prepare the update data - only include fields that exist
      const updateData: Partial<StockRecommendation> = {};
      
      if (this.editedRecommendation.stockSymbol !== undefined) updateData.stockSymbol = this.editedRecommendation.stockSymbol;
      if (this.editedRecommendation.stockName !== undefined) updateData.stockName = this.editedRecommendation.stockName;
      if (this.editedRecommendation.stockExchange !== undefined) updateData.stockExchange = this.editedRecommendation.stockExchange;
      if (this.editedRecommendation.recommendation !== undefined) updateData.recommendation = this.editedRecommendation.recommendation;
      if (this.editedRecommendation.cmp !== undefined) updateData.cmp = this.editedRecommendation.cmp;
      if (this.editedRecommendation.changePct !== undefined) updateData.changePct = this.editedRecommendation.changePct;
      if (this.editedRecommendation.date !== undefined) updateData.date = this.editedRecommendation.date;
      if (this.editedRecommendation.currentPrice !== undefined) updateData.currentPrice = this.editedRecommendation.currentPrice;
      if (this.editedRecommendation.targetPrice !== undefined) updateData.targetPrice = this.editedRecommendation.targetPrice;
      if (this.editedRecommendation.entryPrice !== undefined) updateData.entryPrice = this.editedRecommendation.entryPrice;
      if (this.editedRecommendation.entryRangeMin !== undefined) updateData.entryRangeMin = this.editedRecommendation.entryRangeMin;
      if (this.editedRecommendation.entryRangeMax !== undefined) updateData.entryRangeMax = this.editedRecommendation.entryRangeMax;
      if (this.editedRecommendation.stoploss !== undefined) updateData.stoploss = this.editedRecommendation.stoploss;
      if (this.editedRecommendation.potentialLeftPct !== undefined) updateData.potentialLeftPct = this.editedRecommendation.potentialLeftPct;
      if (this.editedRecommendation.durationText !== undefined) updateData.durationText = this.editedRecommendation.durationText;
      if (this.editedRecommendation.exitPrice !== undefined) {
        const exitPriceValue =
          typeof this.editedRecommendation.exitPrice === 'string'
            ? parseFloat(this.editedRecommendation.exitPrice)
            : this.editedRecommendation.exitPrice;
        if (exitPriceValue !== undefined && !isNaN(exitPriceValue)) {
          updateData.exitPrice = exitPriceValue;
        }
      }
      if (this.editedRecommendation.exitDate !== undefined) updateData.exitDate = this.editedRecommendation.exitDate;
      if (this.editedRecommendation.exitTime !== undefined) updateData.exitTime = this.editedRecommendation.exitTime;
      if (this.editedRecommendation.actions !== undefined) updateData.actions = this.editedRecommendation.actions;
      if (this.editedRecommendation.alerts !== undefined) updateData.alerts = this.editedRecommendation.alerts;
      if (this.editedRecommendation.reason !== undefined) updateData.reason = this.editedRecommendation.reason;
      if (this.editedRecommendation.researchReportUrl !== undefined) updateData.researchReportUrl = this.editedRecommendation.researchReportUrl;
      if (this.editedRecommendation.profitEarned !== undefined) updateData.profitEarned = this.editedRecommendation.profitEarned;

      console.log('Update Data:');
      console.log(updateData);
      
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

  // Report Upload Methods
  triggerResearchReportUpload() {
    this.reportFileInput.nativeElement.click();
  }

  async onResearchReportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      this.isUploadingReport = true;

      const symbol = this.editedRecommendation.stockSymbol || 'stock';
      const fileName = `${symbol}_report_${Date.now()}.${file.name.split('.').pop()}`;

      const downloadUrl = await this.storageService
        .uploadResearchReport(file, 'research-reports/', fileName)
        .toPromise();

      if (downloadUrl) {
        this.editedRecommendation.researchReportUrl = downloadUrl;
        await this.presentToast('Research report uploaded successfully!', 'success');
      }
    } catch (error) {
      console.error('Error uploading research report:', error);
      await this.presentToast(
        'Failed to upload research report: ' + (error as Error).message,
        'danger'
      );
    } finally {
      this.isUploadingReport = false;
      input.value = '';
    }
  }

  async removeResearchReport() {
    const alert = await this.alertController.create({
      header: 'Remove Research Report',
      message: 'Are you sure you want to remove this research report?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            if (this.editedRecommendation.researchReportUrl) {
              delete this.editedRecommendation.researchReportUrl;
              this.presentToast('Research report removed successfully!', 'success');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  viewReport() {
    if (this.editedRecommendation.researchReportUrl) {
      window.open(this.editedRecommendation.researchReportUrl, '_blank');
    }
  }

  viewReportInTable(url: string | undefined) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
