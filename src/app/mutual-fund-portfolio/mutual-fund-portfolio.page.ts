import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import {
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { UserService, MutualFund } from '../services/user.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-mutual-fund-portfolio',
  templateUrl: './mutual-fund-portfolio.page.html',
  styleUrls: ['./mutual-fund-portfolio.page.scss'],
  standalone: false,
})
export class MutualFundPortfolioPage implements OnInit, AfterViewInit {
  mutualFunds: MutualFund[] = [];
  filteredMutualFunds: MutualFund[] = [];
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Chart reference
  @ViewChild('weightChart', { static: false })
  weightChartRef!: ElementRef<HTMLCanvasElement>;

  weightChart!: Chart;

  constructor(
    private userService: UserService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadMutualFunds();
  }

  ngAfterViewInit() {
    // Chart will be created after data is loaded
    if (this.filteredMutualFunds.length > 0) {
      setTimeout(() => {
        this.generateChart();
      }, 100);
    }
  }

  async loadMutualFunds() {
    try {
      this.mutualFunds = await this.userService.getMutualFunds();
      this.applyFilters();
      
      // Auto-import default data if no mutual funds exist
      if (this.mutualFunds.length === 0) {
        await this.autoImportDefaultFunds();
      }
    } catch (error) {
      console.error('Error loading mutual funds:', error);
      await this.presentToast('Failed to load mutual funds', 'danger');
      this.mutualFunds = [];
      this.applyFilters();
    }
  }

  private async autoImportDefaultFunds() {
    const fundsData = [
      {
        fundName: 'UTI Nifty 50 Index Fund (Direct)',
        category: 'Large Cap',
        portfolioWeight: 25,
        expenseRatio: 0.17,
        role: 'Core Stability Anchor',
      },
      {
        fundName: 'Parag Parikh Flexi Cap Fund (Direct)',
        category: 'Flexi Cap',
        portfolioWeight: 25,
        expenseRatio: 0.63,
        role: 'Value + Global Diversification',
      },
      {
        fundName: 'Invesco India Mid Cap Fund (Direct)',
        category: 'Mid Cap',
        portfolioWeight: 20,
        expenseRatio: 0.65,
        role: 'Alpha Generation Engine',
      },
      {
        fundName: 'Bandhan Small Cap Fund (Direct)',
        category: 'Small Cap',
        portfolioWeight: 15,
        expenseRatio: 0.41,
        role: 'Maximum Growth Potential',
      },
      {
        fundName: 'Nippon India Multi Cap Fund (Direct)',
        category: 'Multi Cap',
        portfolioWeight: 15,
        expenseRatio: 0.73,
        role: 'Forced Diversification Buffer',
      },
    ];

    const loading = await this.loadingController.create({
      message: 'Importing default mutual funds...',
    });
    await loading.present();

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const data of fundsData) {
        try {
          const mutualFund: Omit<MutualFund, 'id' | 'createdAt'> = {
            fundName: data.fundName,
            category: data.category,
            portfolioWeight: data.portfolioWeight,
            expenseRatio: data.expenseRatio,
            role: data.role,
            createdBy: 'admin',
          };

          const result = await this.userService.addMutualFund(mutualFund);
          this.mutualFunds.push(result);
          successCount++;
        } catch (error) {
          console.error(`Error adding mutual fund ${data.fundName}:`, error);
          errorCount++;
        }
      }

      this.applyFilters();
      await loading.dismiss();

      if (errorCount === 0) {
        await this.presentToast(
          `Successfully imported ${successCount} mutual funds!`,
          'success'
        );
      } else {
        await this.presentToast(
          `Imported ${successCount} mutual funds. ${errorCount} failed.`,
          'warning'
        );
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Error during auto import:', error);
      await this.presentToast('Auto import failed', 'danger');
    }
  }

  applyFilters() {
    let filtered = [...this.mutualFunds];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (fund) =>
          fund.fundName.toLowerCase().includes(term) ||
          fund.category.toLowerCase().includes(term) ||
          fund.role.toLowerCase().includes(term)
      );
    }

    this.filteredMutualFunds = filtered;
    this.currentPage = 1; // Reset to first page
    // Update chart when filters change
    setTimeout(() => {
      this.generateChart();
    }, 100);
  }

  generateChart() {
    if (this.filteredMutualFunds.length === 0) {
      if (this.weightChart) {
        this.weightChart.destroy();
      }
      return;
    }

    const labels = this.filteredMutualFunds.map((fund) => fund.fundName);
    const data = this.filteredMutualFunds.map((fund) => fund.portfolioWeight);
    const colors = this.generateColors(labels.length);

    if (this.weightChart) {
      this.weightChart.destroy();
    }

    if (this.weightChartRef && this.weightChartRef.nativeElement) {
      this.weightChart = new Chart(this.weightChartRef.nativeElement, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: '#fff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return context.label + ': ' + context.parsed.toFixed(1) + '%';
                },
              },
            },
          },
        },
      });
    }
  }

  generateColors(count: number): string[] {
    const baseColors = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
      '#FF6384',
      '#C9CBCF',
      '#4BC0C0',
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  onSearchChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.applyFilters();
  }

  async addMutualFund() {
    const alert = await this.alertController.create({
      header: 'Add New Mutual Fund',
      inputs: [
        {
          name: 'fundName',
          type: 'text',
          placeholder: 'Fund Name (e.g., HDFC Equity Fund)',
        },
        {
          name: 'category',
          type: 'text',
          placeholder: 'Category (e.g., Large Cap, Mid Cap)',
        },
        {
          name: 'portfolioWeight',
          type: 'number',
          placeholder: 'Portfolio Weight (%) (e.g., 15.5)',
          min: 0,
          max: 100,
        },
        {
          name: 'expenseRatio',
          type: 'number',
          placeholder: 'Expense Ratio (%) (e.g., 1.5)',
          min: 0,
          max: 10,
        },
        {
          name: 'role',
          type: 'text',
          placeholder: 'Role (e.g., Growth, Income)',
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
            this.saveMutualFund(data);
          },
        },
      ],
    });

    await alert.present();
  }

  async editMutualFund(mutualFund: MutualFund) {
    const alert = await this.alertController.create({
      header: 'Edit Mutual Fund',
      inputs: [
        {
          name: 'fundName',
          type: 'text',
          value: mutualFund.fundName,
          placeholder: 'Fund Name',
        },
        {
          name: 'category',
          type: 'text',
          value: mutualFund.category,
          placeholder: 'Category',
        },
        {
          name: 'portfolioWeight',
          type: 'number',
          value: mutualFund.portfolioWeight.toString(),
          placeholder: 'Portfolio Weight (%)',
          min: 0,
          max: 100,
        },
        {
          name: 'expenseRatio',
          type: 'number',
          value: mutualFund.expenseRatio.toString(),
          placeholder: 'Expense Ratio (%)',
          min: 0,
          max: 10,
        },
        {
          name: 'role',
          type: 'text',
          value: mutualFund.role,
          placeholder: 'Role',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Update',
          handler: (data) => {
            this.updateMutualFund(mutualFund.id!, data);
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteMutualFund(mutualFund: MutualFund) {
    const alert = await this.alertController.create({
      header: 'Delete Mutual Fund',
      message: `Are you sure you want to delete ${mutualFund.fundName}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.performDeleteMutualFund(mutualFund);
          },
        },
      ],
    });

    await alert.present();
  }

  private async saveMutualFund(data: any) {
    if (
      !data.fundName ||
      !data.category ||
      !data.portfolioWeight ||
      !data.expenseRatio ||
      !data.role
    ) {
      await this.presentToast('Please fill in all required fields', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Adding mutual fund...',
    });
    await loading.present();

    try {
      const mutualFund: Omit<MutualFund, 'id' | 'createdAt'> = {
        fundName: data.fundName.trim(),
        category: data.category.trim(),
        portfolioWeight: parseFloat(data.portfolioWeight),
        expenseRatio: parseFloat(data.expenseRatio),
        role: data.role.trim(),
        createdBy: 'admin',
      };

      const result = await this.userService.addMutualFund(mutualFund);
      this.mutualFunds.push(result);
      this.applyFilters();
      await loading.dismiss();
      await this.presentToast('Mutual fund added successfully', 'success');
      setTimeout(() => {
        this.generateChart();
      }, 100);
    } catch (error) {
      await loading.dismiss();
      console.error('Error adding mutual fund:', error);
      await this.presentToast('Failed to add mutual fund', 'danger');
    }
  }

  private async updateMutualFund(id: string, data: any) {
    const loading = await this.loadingController.create({
      message: 'Updating mutual fund...',
    });
    await loading.present();

    try {
      const updateData: Partial<MutualFund> = {
        fundName: data.fundName.trim(),
        category: data.category.trim(),
        portfolioWeight: parseFloat(data.portfolioWeight),
        expenseRatio: parseFloat(data.expenseRatio),
        role: data.role.trim(),
      };

      const result = await this.userService.updateMutualFund(id, updateData);

      // Update local array
      const index = this.mutualFunds.findIndex((f) => f.id === id);
      if (index !== -1) {
        this.mutualFunds[index] = result;
      }

      this.applyFilters();
      await loading.dismiss();
      await this.presentToast('Mutual fund updated successfully', 'success');
      setTimeout(() => {
        this.generateChart();
      }, 100);
    } catch (error) {
      await loading.dismiss();
      console.error('Error updating mutual fund:', error);
      await this.presentToast('Failed to update mutual fund', 'danger');
    }
  }

  private async performDeleteMutualFund(mutualFund: MutualFund) {
    const loading = await this.loadingController.create({
      message: 'Deleting mutual fund...',
    });
    await loading.present();

    try {
      await this.userService.deleteMutualFund(mutualFund.id!);

      // Remove from local arrays
      this.mutualFunds = this.mutualFunds.filter((f) => f.id !== mutualFund.id);
      this.filteredMutualFunds = this.filteredMutualFunds.filter(
        (f) => f.id !== mutualFund.id
      );

      await loading.dismiss();
      await this.presentToast('Mutual fund deleted successfully', 'success');
      setTimeout(() => {
        this.generateChart();
      }, 100);
    } catch (error) {
      await loading.dismiss();
      console.error('Error deleting mutual fund:', error);
      await this.presentToast('Failed to delete mutual fund', 'danger');
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

  // Pagination methods
  getPaginatedMutualFunds(): MutualFund[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredMutualFunds.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredMutualFunds.length / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getTotalMutualFunds(): number {
    return this.filteredMutualFunds.length;
  }

  getTotalWeight(): number {
    return this.filteredMutualFunds.reduce(
      (sum, fund) => sum + fund.portfolioWeight,
      0
    );
  }

  async bulkImportMutualFunds() {
    const fundsData = [
      {
        fundName: 'UTI Nifty 50 Index Fund (Direct)',
        category: 'Large Cap',
        portfolioWeight: 25,
        expenseRatio: 0.17,
        role: 'Core Stability Anchor',
      },
      {
        fundName: 'Parag Parikh Flexi Cap Fund (Direct)',
        category: 'Flexi Cap',
        portfolioWeight: 25,
        expenseRatio: 0.63,
        role: 'Value + Global Diversification',
      },
      {
        fundName: 'Invesco India Mid Cap Fund (Direct)',
        category: 'Mid Cap',
        portfolioWeight: 20,
        expenseRatio: 0.65,
        role: 'Alpha Generation Engine',
      },
      {
        fundName: 'Bandhan Small Cap Fund (Direct)',
        category: 'Small Cap',
        portfolioWeight: 15,
        expenseRatio: 0.41,
        role: 'Maximum Growth Potential',
      },
      {
        fundName: 'Nippon India Multi Cap Fund (Direct)',
        category: 'Multi Cap',
        portfolioWeight: 15,
        expenseRatio: 0.73,
        role: 'Forced Diversification Buffer',
      },
    ];

    const alert = await this.alertController.create({
      header: 'Bulk Import Mutual Funds',
      message: `Are you sure you want to import ${fundsData.length} mutual funds? This will add them to Firestore.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Import',
          handler: () => {
            this.performBulkImport(fundsData);
          },
        },
      ],
    });

    await alert.present();
  }

  private async performBulkImport(fundsData: any[]) {
    const loading = await this.loadingController.create({
      message: 'Importing mutual funds to Firestore...',
    });
    await loading.present();

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const data of fundsData) {
        try {
          const mutualFund: Omit<MutualFund, 'id' | 'createdAt'> = {
            fundName: data.fundName,
            category: data.category,
            portfolioWeight: data.portfolioWeight,
            expenseRatio: data.expenseRatio,
            role: data.role,
            createdBy: 'admin',
          };

          const result = await this.userService.addMutualFund(mutualFund);
          this.mutualFunds.push(result);
          successCount++;
        } catch (error) {
          console.error(`Error adding mutual fund ${data.fundName}:`, error);
          errorCount++;
        }
      }

      this.applyFilters();
      await loading.dismiss();

      if (errorCount === 0) {
        await this.presentToast(
          `Successfully imported ${successCount} mutual funds!`,
          'success'
        );
      } else {
        await this.presentToast(
          `Imported ${successCount} mutual funds. ${errorCount} failed.`,
          'warning'
        );
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Error during bulk import:', error);
      await this.presentToast('Bulk import failed', 'danger');
    }
  }
}

