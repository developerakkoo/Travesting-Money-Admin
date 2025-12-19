import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
} from '@angular/forms';
import {
  IonicModule,
  PopoverController,
  ToastController,
  AlertController,
  LoadingController,
} from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { StockIdeaService } from './stock-idea.service';
import { StockIdeaStore } from './stock-idea.store';
import {
  PopoverInfoComponent,
  PopoverInfoData,
} from './popover-info.component';
import { RecentTradeUpdatesPipe } from './recent-trade-updates.pipe';
import { StockIdea, TradeAction, Term, TradeActionType } from './models';
import { UserService, StockRecommendation } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-stock-idea-editor',
  templateUrl: './stock-idea-editor.page.html',
  styleUrls: ['./stock-idea-editor.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RecentTradeUpdatesPipe,
  ],
})
export class StockIdeaEditorPage implements OnInit, OnDestroy {
  // File input ViewChild references
  @ViewChild('reportFileInput') reportFileInput!: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private stockIdeaService = inject(StockIdeaService);
  private userService = inject(UserService);
  private storageService = inject(StorageService);
  private store = inject(StockIdeaStore);
  private popoverController = inject(PopoverController);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);

  stockIdeaForm!: FormGroup;
  private subscriptions: Subscription[] = [];

  // File upload state
  isUploadingReport = false;

  // Store signals
  currentIdea = this.store.currentIdea;
  loading = this.store.loading;
  error = this.store.error;
  modifiedFlags = this.store.modifiedFlags;
  isOutsideBuyZone = this.store.isOutsideBuyZone;
  recentUpdates = this.store.recentUpdates;
  isPublished = this.store.isPublished;
  returnsSoFar = this.store.returnsSoFar;
  potentialLeft = this.store.potentialLeft;

  // Form controls
  get actionsArray(): FormArray {
    return this.stockIdeaForm.get('actions') as FormArray;
  }

  ngOnInit() {
    this.initializeForm();
    this.loadStockIdea();
    this.setupFormSubscriptions();
    this.handleUserContext();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private initializeForm(): void {
    this.stockIdeaForm = this.fb.group({
      symbol: ['', [Validators.required, Validators.minLength(1)]],
      stockName: ['', [Validators.required]],
      stockExchange: ['NSE', [Validators.required]],
      term: ['mid', [Validators.required]],
      action: ['BUY', [Validators.required]],
      cmp: [null],
      changePct: [null],
      date: ['', [Validators.required]],
      entryPrice: [0, [Validators.required, Validators.min(0.01)]],
      entryRangeMin: [0, [Validators.min(0.01)]],
      entryRangeMax: [0, [Validators.min(0.01)]],
      stoploss: [0, [Validators.required, Validators.min(0.01)]],
      potentialLeftPct: [0, [Validators.required, Validators.min(0.1)]],
      durationText: ['', [Validators.required]],
      profitEarned: ['', []],
      actions: this.fb.array([]),
      alerts: this.fb.array([]),
      researchReportUrl: [''],
    });

    // Add custom validators
    this.stockIdeaForm.setValidators(this.rangeValidator.bind(this));
  }

  private rangeValidator(
    control: AbstractControl
  ): { [key: string]: any } | null {
    const entryRangeMin = control.get('entryRangeMin')?.value;
    const entryRangeMax = control.get('entryRangeMax')?.value;

    if (entryRangeMin && entryRangeMax && entryRangeMin > entryRangeMax) {
      return { rangeInvalid: true };
    }

    return null;
  }

  private loadStockIdea(): void {
    const id = this.route.snapshot.paramMap.get('id') || 'new';

    this.store.setLoading(true);
    this.store.setError(null);

    const sub = this.stockIdeaService.getById(id).subscribe({
      next: (idea) => {
        this.store.setCurrentIdea(idea);
        this.patchForm(idea);
        this.store.setLoading(false);
      },
      error: (error) => {
        this.store.setError(error.message);
        this.store.setLoading(false);
        this.presentToast('Failed to load stock idea', 'danger');
      },
    });

    this.subscriptions.push(sub);
  }

  private patchForm(idea: StockIdea): void {
    this.stockIdeaForm.patchValue({
      symbol: idea.symbol,
      stockName: idea.stockName,
      stockExchange: (idea as any).stockExchange || 'NSE',
      term: idea.term,
      action: idea.action,
      cmp: idea.cmp,
      changePct: idea.changePct,
      date: idea.date,
      entryPrice: idea.entryPrice,
      entryRangeMin: idea.entryRangeMin,
      entryRangeMax: idea.entryRangeMax,
      stoploss: idea.stoploss,
      potentialLeftPct: idea.potentialLeftPct,
      durationText: idea.durationText,
      // imageUrl: idea.imageUrl, // COMMENTED OUT
      // researchReportUrl: idea.researchReportUrl, // COMMENTED OUT
    });

    // Clear and rebuild actions array
    this.actionsArray.clear();
    idea.actions.forEach((action) => this.addActionFormGroup(action));

    // Clear and rebuild alerts array
    const alertsArray = this.stockIdeaForm.get('alerts') as FormArray;
    alertsArray.clear();
    idea.alerts?.forEach((alert) => alertsArray.push(this.fb.control(alert)));
  }

  private setupFormSubscriptions(): void {
    // Watch for form changes to update store and compute diffs
    const sub = this.stockIdeaForm.valueChanges.subscribe((formValue) => {
      const currentIdea = this.currentIdea();
      if (currentIdea) {
        const updatedIdea = { ...currentIdea, ...formValue };
        this.store.setCurrentIdea(updatedIdea);

        // Compute modified flags if idea is published
        if (currentIdea.postedAt && currentIdea.baseline) {
          const flags = this.stockIdeaService.computeDiff(
            currentIdea.baseline,
            updatedIdea
          );
          this.store.setModifiedFlags(flags);
        }
      }
    });

    this.subscriptions.push(sub);
  }

  addActionFormGroup(action?: TradeAction): void {
    const actionGroup = this.fb.group({
      id: [action?.id || this.generateId()],
      type: [action?.type || 'AVERAGING', [Validators.required]],
      date: [action?.date || new Date().toISOString(), [Validators.required]],
      entryPrice: [
        action?.entryPrice || 0,
        [Validators.required, Validators.min(0.01)],
      ],
      entryRangeMin: [action?.entryRangeMin || 0, [Validators.min(0.01)]],
      entryRangeMax: [action?.entryRangeMax || 0, [Validators.min(0.01)]],
      note: [action?.note || ''],
    });

    this.actionsArray.push(actionGroup);
  }

  removeAction(index: number): void {
    this.actionsArray.removeAt(index);
  }

  addAlert(): void {
    this.alertController
      .create({
        header: 'Add Alert',
        inputs: [
          {
            name: 'alert',
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
              if (data.alert?.trim()) {
                const alertsArray = this.stockIdeaForm.get(
                  'alerts'
                ) as FormArray;
                alertsArray.push(this.fb.control(data.alert.trim()));
              }
            },
          },
        ],
      })
      .then((alert) => alert.present());
  }

  removeAlert(index: number): void {
    const alertsArray = this.stockIdeaForm.get('alerts') as FormArray;
    alertsArray.removeAt(index);
  }

  async showInfoPopover(event: Event, data: PopoverInfoData): Promise<void> {
    const popover = await this.popoverController.create({
      component: PopoverInfoComponent,
      componentProps: { data },
      event,
      translucent: true,
    });

    await popover.present();
  }

  async saveDraft(): Promise<void> {
    if (this.stockIdeaForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Saving to Firestore...',
    });
    await loading.present();

    const formValue = this.stockIdeaForm.value;
    const currentIdea = this.currentIdea();

    try {
      // Convert StockIdea to StockRecommendation format for Firestore
      const recommendation: Omit<StockRecommendation, 'id' | 'createdAt'> = {
        userId: 'admin', // Default admin user for now
        stockSymbol: formValue.symbol,
        stockName: formValue.stockName,
        stockExchange: formValue.stockExchange || 'NSE',
        term: formValue.term || 'mid',
        recommendation: formValue.action,
        cmp: formValue.cmp || undefined,
        changePct: formValue.changePct || undefined,
        date: formValue.date,
        currentPrice: formValue.entryPrice,
        targetPrice: this.getCalculatedTargetPrice() || 0,
        entryPrice: formValue.entryPrice,
        targetHit: false,
        stoplossHit: false,
  profitEarned: formValue.profitEarned || '',
        isMarkedForDeletion: false,
        entryRangeMin: formValue.entryRangeMin,
        entryRangeMax: formValue.entryRangeMax,
        stoploss: formValue.stoploss,
        potentialLeftPct: formValue.potentialLeftPct,
        durationText: formValue.durationText,
        actions: formValue.actions || [],
        alerts: formValue.alerts || [],
        reason: `Stock idea: ${formValue.durationText}. Stop loss: ₹${formValue.stoploss}`,
        researchReportUrl: formValue.researchReportUrl || undefined,
        createdBy: 'admin',
      };

      // Save to Firestore using UserService
      const firestoreResult = await this.userService.addStockRecommendation(
        recommendation
      );

      // Also save locally using StockIdeaService for local state management
      let localResult: StockIdea;
      if (currentIdea?.id && currentIdea.id !== 'new') {
        localResult = (await this.stockIdeaService
          .update(currentIdea.id, formValue)
          .toPromise()) as StockIdea;
      } else {
        localResult = (await this.stockIdeaService
          .create(formValue)
          .toPromise()) as StockIdea;
              profitEarned: formValue.profitEarned || '',

      this.store.setCurrentIdea(localResult);
      await loading.dismiss();
      this.presentToast(
        'Recommendation saved to Firestore successfully!',
        'success'
      );
    }
      // Navigate to the saved idea
      if (currentIdea?.id === 'new') {
        this.router.navigate(['/admin/stock-ideas', localResult.id]);
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Error saving recommendation:', error);
      this.presentToast(
        'Failed to save recommendation: ' + (error as Error).message,
        'danger'
      );
    }
  }

  async publish(): Promise<void> {
    if (this.stockIdeaForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const currentIdea = this.currentIdea();
    if (!currentIdea?.id || currentIdea.id === 'new') {
      await this.saveDraft();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Publishing to Firestore...',
    });
    await loading.present();

    try {
      // Publish locally first
      const result = (await this.stockIdeaService
        .publish(currentIdea.id)
        .toPromise()) as StockIdea;

      // Also ensure it's saved to Firestore
      const formValue = this.stockIdeaForm.value;
      const recommendation: Omit<StockRecommendation, 'id' | 'createdAt'> = {
        userId: 'admin',
        stockSymbol: formValue.symbol,
        stockName: formValue.stockName,
        stockExchange: formValue.stockExchange || 'NSE',
        term: formValue.term || 'mid',
        recommendation: formValue.action,
        cmp: formValue.cmp || undefined,
        changePct: formValue.changePct || undefined,
        date: formValue.date,
        currentPrice: formValue.entryPrice,
        targetHit: currentIdea?.targetHit || false,
        stoplossHit: currentIdea?.stoplossHit || false,
  profitEarned: formValue.profitEarned || '',
        isMarkedForDeletion: currentIdea?.isMarkedForDeletion || false,
        targetPrice: this.getCalculatedTargetPrice() || 0,
        entryPrice: formValue.entryPrice,
        entryRangeMin: formValue.entryRangeMin,
        entryRangeMax: formValue.entryRangeMax,
        stoploss: formValue.stoploss,
        potentialLeftPct: formValue.potentialLeftPct,
        durationText: formValue.durationText,
        actions: formValue.actions || [],
        alerts: formValue.alerts || [],
        reason: `Published stock idea: ${formValue.durationText}. Stop loss: ₹${formValue.stoploss}`,
        // imageUrl: formValue.imageUrl, // COMMENTED OUT
        // researchReportUrl: formValue.researchReportUrl, // COMMENTED OUT
        createdBy: 'admin',
      };

      await this.userService.addStockRecommendation(recommendation);

      this.store.setCurrentIdea(result);
      await loading.dismiss();
      this.presentToast(
        'Stock idea published to Firestore successfully!',
        'success'
      );
    } catch (error) {
      await loading.dismiss();
      console.error('Error publishing recommendation:', error);
      this.presentToast(
        'Failed to publish stock idea: ' + (error as Error).message,
        'danger'
      );
    }
  }

  async update(): Promise<void> {
    if (this.stockIdeaForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const currentIdea = this.currentIdea();
    if (!currentIdea?.id) {
      this.presentToast('No stock idea to update', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Updating in Firestore...',
    });
    await loading.present();

    try {
      const formValue = this.stockIdeaForm.value;

      // Update locally first
      const result = (await this.stockIdeaService
        .update(currentIdea.id, formValue)
        .toPromise()) as StockIdea;

      // Also update in Firestore
      const recommendation: Omit<StockRecommendation, 'id' | 'createdAt'> = {
        userId: 'admin',
        stockSymbol: formValue.symbol,
        stockName: formValue.stockName,
        stockExchange: formValue.stockExchange || 'NSE',
        term: formValue.term || 'mid',
        recommendation: formValue.action,
        cmp: formValue.cmp || undefined,
        changePct: formValue.changePct || undefined,
        date: formValue.date,
        currentPrice: formValue.entryPrice,
        targetPrice: this.getCalculatedTargetPrice() || 0,
        entryPrice: formValue.entryPrice,
        entryRangeMin: formValue.entryRangeMin,
        entryRangeMax: formValue.entryRangeMax,
        stoploss: formValue.stoploss,
        targetHit: currentIdea?.targetHit || false,
        stoplossHit: currentIdea?.stoplossHit || false,
          profitEarned: formValue.profitEarned || '',
        isMarkedForDeletion: currentIdea?.isMarkedForDeletion || false,
        potentialLeftPct: formValue.potentialLeftPct,
        durationText: formValue.durationText,
        actions: formValue.actions || [],
        alerts: formValue.alerts || [],
        reason: `Updated stock idea: ${formValue.durationText}. Stop loss: ₹${formValue.stoploss}`,
        // imageUrl: formValue.imageUrl, // COMMENTED OUT
        // researchReportUrl: formValue.researchReportUrl, // COMMENTED OUT
        createdBy: 'admin',
      };

      await this.userService.addStockRecommendation(recommendation);

      this.store.setCurrentIdea(result);
      await loading.dismiss();
      this.presentToast(
        'Stock idea updated in Firestore successfully!',
        'success'
      );
    } catch (error) {
      await loading.dismiss();
      console.error('Error updating recommendation:', error);
      this.presentToast(
        'Failed to update stock idea: ' + (error as Error).message,
        'danger'
      );
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.stockIdeaForm.controls).forEach((key) => {
      const control = this.stockIdeaForm.get(key);
      control?.markAsTouched();
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Calculate target price based on potential percentage
  getCalculatedTargetPrice(): number | null {
    const entryPrice = this.stockIdeaForm.get('entryPrice')?.value;
    const potentialPct = this.stockIdeaForm.get('potentialLeftPct')?.value;

    if (entryPrice && potentialPct && entryPrice > 0 && potentialPct > 0) {
      // potentialPct is already in percentage form (e.g., 25 for 25%)
      return entryPrice * (1 + potentialPct / 100);
    }

    return null;
  }

  private handleUserContext(): void {
    const userId = this.route.snapshot.queryParamMap.get('userId');
    const userName = this.route.snapshot.queryParamMap.get('userName');

    if (userId && userName) {
      // Pre-fill the stock idea with user context
      const currentIdea = this.currentIdea();
      if (currentIdea) {
        const updatedIdea = {
          ...currentIdea,
          // You can add user-specific fields here if needed
          // For example, you might want to store the target user ID
        };
        this.store.setCurrentIdea(updatedIdea);
      }

      // Show a toast indicating this is for a specific user
      this.presentToast(`Creating stock idea for ${userName}`, 'primary');
    }
  }

  private async presentToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 3000,
    });
    await toast.present();
  }

  // Report Upload Methods
  triggerResearchReportUpload(): void {
    this.reportFileInput.nativeElement.click();
  }

  async onResearchReportFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      this.isUploadingReport = true;

      // Create a unique file name with stock symbol
      const symbol = this.stockIdeaForm.get('symbol')?.value || 'stock';
      const fileName = `${symbol}_report_${Date.now()}.${file.name.split('.').pop()}`;

      // Upload the research report
      const downloadUrl = await this.storageService
        .uploadResearchReport(file, 'research-reports/', fileName)
        .toPromise();

      if (downloadUrl) {
        // Update the form and current idea
        this.stockIdeaForm.patchValue({ researchReportUrl: downloadUrl });

        // Update the store
        const currentIdea = this.currentIdea();
        if (currentIdea) {
          const updatedIdea = {
            ...currentIdea,
            researchReportUrl: downloadUrl,
          };
          this.store.setCurrentIdea(updatedIdea);
        }

        await this.presentToast(
          'Research report uploaded successfully!',
          'success'
        );
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

  async removeResearchReport(): Promise<void> {
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
          handler: async () => {
            try {
              const currentIdea = this.currentIdea();
              if (currentIdea?.researchReportUrl) {
                // Delete from Firebase Storage
                await this.storageService
                  .deleteFile(currentIdea.researchReportUrl)
                  .toPromise();

                // Update the form and current idea
                this.stockIdeaForm.patchValue({ researchReportUrl: '' });

                // Update the store
                const updatedIdea = {
                  ...currentIdea,
                  researchReportUrl: undefined,
                };
                this.store.setCurrentIdea(updatedIdea);

                await this.presentToast(
                  'Research report removed successfully!',
                  'success'
                );
              }
            } catch (error) {
              console.error('Error removing research report:', error);
              await this.presentToast(
                'Failed to remove research report: ' + (error as Error).message,
                'danger'
              );
            }
          },
        },
      ],
    });

    await alert.present();
  }

  viewReport() {
    const url = this.stockIdeaForm.get('researchReportUrl')?.value;
    if (url) {
      window.open(url, '_blank');
    }
  }

  // Info popover data
  getBuySellInfo(): PopoverInfoData {
    return {
      title: 'Buy/Sell Action',
      content: [
        'BUY: Recommend purchasing the stock at current or specified price',
        'SELL: Recommend selling the stock at current or specified price',
        'Consider market conditions and your risk tolerance',
      ],
      icon: 'trending-up',
    };
  }

  getStoplossInfo(): PopoverInfoData {
    return {
      title: 'Stop Loss',
      content:
        'The price level at which you should exit the position to limit losses. This is your risk management tool.',
      icon: 'shield-checkmark',
    };
  }

  getTargetInfo(): PopoverInfoData {
    return {
      title: 'Potential Percentage',
      content:
        'The expected percentage gain from the entry price. Enter the percentage value (e.g., 25 for 25%). Target price will be calculated as: Entry Price × (1 + Potential% / 100)',
      icon: 'trending-up',
    };
  }

  getDurationInfo(): PopoverInfoData {
    return {
      title: 'Duration',
      content:
        'Expected time frame for the trade. Short-term (days to weeks), Mid-term (weeks to months), Long-term (months to years).',
      icon: 'time',
    };
  }

  getAveragingInfo(): PopoverInfoData {
    return {
      title: 'Averaging',
      content:
        'Adding more shares to your position at different price levels to reduce your average cost.',
      icon: 'add-circle',
    };
  }

  getPartialBookingInfo(): PopoverInfoData {
    return {
      title: 'Partial Booking',
      content:
        'Selling a portion of your position to book profits while keeping some shares for further upside.',
      icon: 'cash',
    };
  }
}
