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
import { UserService, Holding } from '../services/user.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.page.html',
  styleUrls: ['./portfolio.page.scss'],
  standalone: false,
})
export class PortfolioPage implements OnInit, AfterViewInit {
  holdings: Holding[] = [];
  filteredHoldings: Holding[] = [];
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Chart references
  @ViewChild('sectorChart', { static: false })
  sectorChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('marketCapChart', { static: false })
  marketCapChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('assetChart', { static: false })
  assetChartRef!: ElementRef<HTMLCanvasElement>;

  sectorChart!: Chart;
  marketCapChart!: Chart;
  assetChart!: Chart;

  constructor(
    private userService: UserService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadHoldings();
  }

  ngAfterViewInit() {
    // Charts will be created after data is loaded
  }

  async loadHoldings() {
    try {
      this.holdings = await this.userService.getHoldings();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading holdings:', error);
      await this.presentToast('Failed to load holdings', 'danger');
      this.holdings = [];
      this.applyFilters();
    }
  }

  applyFilters() {
    let filtered = [...this.holdings];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (holding) =>
          holding.name.toLowerCase().includes(term) ||
          holding.sector.toLowerCase().includes(term) ||
          holding.instrument.toLowerCase().includes(term) ||
          (holding.marketCapitalization && holding.marketCapitalization.toLowerCase().includes(term))
      );
    }

    this.filteredHoldings = filtered;
    this.currentPage = 1; // Reset to first page
    this.generateCharts(); // Update charts when filters change
  }

  generateCharts() {
    this.generateSectorChart();
    this.generateMarketCapChart();
    this.generateAssetChart();
  }

  generateSectorChart() {
    const sectorMap = new Map<string, number>();

    this.filteredHoldings.forEach((holding) => {
      const current = sectorMap.get(holding.sector) || 0;
      sectorMap.set(holding.sector, current + holding.percentageOfHoldings);
    });

    const labels = Array.from(sectorMap.keys());
    const data = Array.from(sectorMap.values());
    const colors = this.generateColors(labels.length);

    if (this.sectorChart) {
      this.sectorChart.destroy();
    }

    this.sectorChart = new Chart(this.sectorChartRef.nativeElement, {
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

  generateMarketCapChart() {
    const capMap = new Map<string, number>();

    this.filteredHoldings.forEach((holding) => {
      // Use actual marketCapitalization field if available, otherwise fallback to percentage-based calculation
      let capCategory = holding.marketCapitalization || 'Small Cap';

      // If no marketCapitalization is set, define market cap categories based on percentage (fallback)
      if (!holding.marketCapitalization) {
        if (holding.percentageOfHoldings >= 5) {
          capCategory = 'Large Cap';
        } else if (holding.percentageOfHoldings >= 2) {
          capCategory = 'Mid Cap';
        } else {
          capCategory = 'Small Cap';
        }
      }

      const current = capMap.get(capCategory) || 0;
      capMap.set(capCategory, current + holding.percentageOfHoldings);
    });

    const labels = Array.from(capMap.keys());
    const data = Array.from(capMap.values());
    const colors = ['#FF6384', '#36A2EB', '#FFCE56']; // Large, Mid, Small cap colors

    if (this.marketCapChart) {
      this.marketCapChart.destroy();
    }

    this.marketCapChart = new Chart(this.marketCapChartRef.nativeElement, {
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

  generateAssetChart() {
    const assetMap = new Map<string, number>();

    this.filteredHoldings.forEach((holding) => {
      const current = assetMap.get(holding.instrument) || 0;
      assetMap.set(holding.instrument, current + holding.percentageOfHoldings);
    });

    const labels = Array.from(assetMap.keys());
    const data = Array.from(assetMap.values());
    const colors = this.generateColors(labels.length);

    if (this.assetChart) {
      this.assetChart.destroy();
    }

    this.assetChart = new Chart(this.assetChartRef.nativeElement, {
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

  async addHolding() {
    const alert = await this.alertController.create({
      header: 'Add New Holding',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Name (e.g., Reliance Industries)',
        },
        {
          name: 'sector',
          type: 'text',
          placeholder: 'Sector (e.g., Energy)',
        },
        {
          name: 'instrument',
          type: 'text',
          placeholder: 'Instrument (e.g., Equity)',
        },
        {
          name: 'percentageOfHoldings',
          type: 'number',
          placeholder: 'Percentage of Holdings (e.g., 15.5)',
          min: 0,
          max: 100,
        },
        {
          name: 'marketCapitalization',
          type: 'text',
          placeholder: 'Market Capitalization (e.g., Large Cap, Mid Cap, Small Cap)',
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
            this.saveHolding(data);
          },
        },
      ],
    });

    await alert.present();
  }

  async editHolding(holding: Holding) {
    const alert = await this.alertController.create({
      header: 'Edit Holding',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: holding.name,
          placeholder: 'Name',
        },
        {
          name: 'sector',
          type: 'text',
          value: holding.sector,
          placeholder: 'Sector',
        },
        {
          name: 'instrument',
          type: 'text',
          value: holding.instrument,
          placeholder: 'Instrument',
        },
        {
          name: 'percentageOfHoldings',
          type: 'number',
          value: holding.percentageOfHoldings.toString(),
          placeholder: 'Percentage of Holdings',
          min: 0,
          max: 100,
        },
        {
          name: 'marketCapitalization',
          type: 'text',
          value: holding.marketCapitalization || '',
          placeholder: 'Market Capitalization (e.g., Large Cap, Mid Cap, Small Cap)',
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
            this.updateHolding(holding.id!, data);
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteHolding(holding: Holding) {
    const alert = await this.alertController.create({
      header: 'Delete Holding',
      message: `Are you sure you want to delete ${holding.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.performDeleteHolding(holding);
          },
        },
      ],
    });

    await alert.present();
  }

  private async saveHolding(data: any) {
    if (
      !data.name ||
      !data.sector ||
      !data.instrument ||
      !data.percentageOfHoldings
    ) {
      await this.presentToast('Please fill in all required fields', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Adding holding...',
    });
    await loading.present();

    try {
      const holding: Omit<Holding, 'id' | 'createdAt'> = {
        name: data.name.trim(),
        sector: data.sector.trim(),
        instrument: data.instrument.trim(),
        percentageOfHoldings: parseFloat(data.percentageOfHoldings),
        marketCapitalization: data.marketCapitalization?.trim() || undefined,
        createdBy: 'admin',
      };

      const result = await this.userService.addHolding(holding);
      this.holdings.push(result);
      this.applyFilters();
      await loading.dismiss();
      await this.presentToast('Holding added successfully', 'success');
    } catch (error) {
      await loading.dismiss();
      console.error('Error adding holding:', error);
      await this.presentToast('Failed to add holding', 'danger');
    }
  }

  private async updateHolding(id: string, data: any) {
    const loading = await this.loadingController.create({
      message: 'Updating holding...',
    });
    await loading.present();

    try {
      const updateData: Partial<Holding> = {
        name: data.name.trim(),
        sector: data.sector.trim(),
        instrument: data.instrument.trim(),
        percentageOfHoldings: parseFloat(data.percentageOfHoldings),
        marketCapitalization: data.marketCapitalization?.trim() || undefined,
      };

      const result = await this.userService.updateHolding(id, updateData);

      // Update local array
      const index = this.holdings.findIndex((h) => h.id === id);
      if (index !== -1) {
        this.holdings[index] = result;
      }

      this.applyFilters();
      await loading.dismiss();
      await this.presentToast('Holding updated successfully', 'success');
    } catch (error) {
      await loading.dismiss();
      console.error('Error updating holding:', error);
      await this.presentToast('Failed to update holding', 'danger');
    }
  }

  private async performDeleteHolding(holding: Holding) {
    const loading = await this.loadingController.create({
      message: 'Deleting holding...',
    });
    await loading.present();

    try {
      await this.userService.deleteHolding(holding.id!);

      // Remove from local arrays
      this.holdings = this.holdings.filter((h) => h.id !== holding.id);
      this.filteredHoldings = this.filteredHoldings.filter(
        (h) => h.id !== holding.id
      );

      await loading.dismiss();
      await this.presentToast('Holding deleted successfully', 'success');
    } catch (error) {
      await loading.dismiss();
      console.error('Error deleting holding:', error);
      await this.presentToast('Failed to delete holding', 'danger');
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
  getPaginatedHoldings(): Holding[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredHoldings.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredHoldings.length / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getTotalHoldings(): number {
    return this.filteredHoldings.length;
  }

  getTotalPercentage(): number {
    return this.filteredHoldings.reduce(
      (sum, holding) => sum + holding.percentageOfHoldings,
      0
    );
  }

  async bulkImportHoldings() {
    const holdingsData = [
      {
        name: 'Bharat Bond ETF - April 2030',
        sector: 'Debt',
        instrument: 'ETF',
        percentage: 20,
        marketCapitalization: undefined,
      },
      {
        name: 'Motilal Oswal MOSt Shares NASDAQ-100 ETF',
        sector: 'Equity',
        instrument: 'ETF',
        percentage: 15,
        marketCapitalization: undefined,
      },
      {
        name: 'Nippon India ETF Gold BeES',
        sector: 'Commodities',
        instrument: 'ETF',
        percentage: 10,
        marketCapitalization: undefined,
      },
      {
        name: 'HDFC Bank Ltd',
        sector: 'Financial',
        instrument: 'Equity',
        percentage: 5,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Nippon India Silver ETF',
        sector: 'Commodities',
        instrument: 'ETF',
        percentage: 5,
        marketCapitalization: undefined,
      },
      {
        name: 'ICICI Bank Ltd',
        sector: 'Financial',
        instrument: 'Equity',
        percentage: 4,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Axis Bank Ltd',
        sector: 'Financial',
        instrument: 'Equity',
        percentage: 3,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Mahindra & Mahindra Ltd',
        sector: 'Automobile',
        instrument: 'Equity',
        percentage: 2.5,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Maruti Suzuki India Ltd',
        sector: 'Automobile',
        instrument: 'Equity',
        percentage: 2.5,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'ITC Ltd',
        sector: 'Consumer Staples',
        instrument: 'Equity',
        percentage: 2,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Kotak Mahindra Bank Ltd',
        sector: 'Financial',
        instrument: 'Equity',
        percentage: 2,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Power Grid Corporation of India Ltd',
        sector: 'Energy',
        instrument: 'Equity',
        percentage: 2,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'State Bank of India',
        sector: 'Financial',
        instrument: 'Equity',
        percentage: 2,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Trent Ltd',
        sector: 'Services',
        instrument: 'Equity',
        percentage: 2,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Coal India Ltd',
        sector: 'Energy',
        instrument: 'Equity',
        percentage: 1.5,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Infosys Ltd',
        sector: 'Technology',
        instrument: 'Equity',
        percentage: 1.5,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'UltraTech Cement Ltd',
        sector: 'Materials',
        instrument: 'Equity',
        percentage: 1.5,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'The Federal Bank Ltd',
        sector: 'Financial',
        instrument: 'Equity',
        percentage: 1.4,
        marketCapitalization: 'Mid Cap',
      },
      {
        name: 'Bharti Airtel Ltd',
        sector: 'Communication',
        instrument: 'Equity',
        percentage: 1,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Cipla Ltd',
        sector: 'Healthcare',
        instrument: 'Equity',
        percentage: 1,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Eternal Ltd',
        sector: 'Services',
        instrument: 'Equity',
        percentage: 1,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'HCL Technologies Ltd',
        sector: 'Technology',
        instrument: 'Equity',
        percentage: 1,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Hindustan Unilever Ltd',
        sector: 'Consumer Staples',
        instrument: 'Equity',
        percentage: 1,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Larsen & Toubro Ltd',
        sector: 'Construction',
        instrument: 'Equity',
        percentage: 1,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Reliance Industries Ltd',
        sector: 'Energy',
        instrument: 'Equity',
        percentage: 1,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'SBI Life Insurance Company Ltd',
        sector: 'Insurance',
        instrument: 'Equity',
        percentage: 1,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Sun Pharmaceutical Industries Ltd',
        sector: 'Healthcare',
        instrument: 'Equity',
        percentage: 1,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Asian Paints Ltd',
        sector: 'Materials',
        instrument: 'Equity',
        percentage: 0.8,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Coforge Ltd',
        sector: 'Technology',
        instrument: 'Equity',
        percentage: 0.8,
        marketCapitalization: 'Mid Cap',
      },
      {
        name: 'InterGlobe Aviation Ltd',
        sector: 'Services',
        instrument: 'Equity',
        percentage: 0.8,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'AIA Engineering Ltd',
        sector: 'Metal & Mining',
        instrument: 'Equity',
        percentage: 0.7,
        marketCapitalization: 'Mid Cap',
      },
      {
        name: 'Dixon Technologies (India) Ltd',
        sector: 'Capital Goods',
        instrument: 'Equity',
        percentage: 0.7,
        marketCapitalization: 'Mid Cap',
      },
      {
        name: "Dr. Reddy's Laboratories Ltd",
        sector: 'Healthcare',
        instrument: 'Equity',
        percentage: 0.7,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'NTPC Ltd',
        sector: 'Energy',
        instrument: 'Equity',
        percentage: 0.7,
        marketCapitalization: 'Large Cap',
      },
      {
        name: 'Persistent Systems Ltd',
        sector: 'Technology',
        instrument: 'Equity',
        percentage: 0.7,
        marketCapitalization: 'Mid Cap',
      },
      {
        name: 'Bharti Hexacom Ltd',
        sector: 'Communication',
        instrument: 'Equity',
        percentage: 0.6,
        marketCapitalization: 'Mid Cap',
      },
      {
        name: 'Max Healthcare Institute Ltd',
        sector: 'Healthcare',
        instrument: 'Equity',
        percentage: 0.6,
        marketCapitalization: 'Mid Cap',
      },
      {
        name: 'Cummins India Ltd',
        sector: 'Capital Goods',
        instrument: 'Equity',
        percentage: 0.5,
        marketCapitalization: 'Mid Cap',
      },
      {
        name: 'Multi Commodity Exchange of India Ltd',
        sector: 'Services',
        instrument: 'Equity',
        percentage: 0.5,
        marketCapitalization: 'Mid Cap',
      },
    ];

    const alert = await this.alertController.create({
      header: 'Bulk Import Holdings',
      message: `Are you sure you want to import ${holdingsData.length} holdings? This will add them to Firestore.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Import',
          handler: () => {
            this.performBulkImport(holdingsData);
          },
        },
      ],
    });

    await alert.present();
  }

  private async performBulkImport(holdingsData: any[]) {
    const loading = await this.loadingController.create({
      message: 'Importing holdings to Firestore...',
    });
    await loading.present();

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const data of holdingsData) {
        try {
          const holding: Omit<Holding, 'id' | 'createdAt'> = {
            name: data.name,
            sector: data.sector,
            instrument: data.instrument,
            percentageOfHoldings: data.percentage,
            marketCapitalization: data.marketCapitalization,
            createdBy: 'admin',
          };

          const result = await this.userService.addHolding(holding);
          this.holdings.push(result);
          successCount++;
        } catch (error) {
          console.error(`Error adding holding ${data.name}:`, error);
          errorCount++;
        }
      }

      this.applyFilters();
      await loading.dismiss();

      if (errorCount === 0) {
        await this.presentToast(
          `Successfully imported ${successCount} holdings!`,
          'success'
        );
      } else {
        await this.presentToast(
          `Imported ${successCount} holdings. ${errorCount} failed.`,
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
