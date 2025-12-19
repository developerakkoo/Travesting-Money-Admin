import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MenuController,
  AlertController,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import {
  UserService,
  User,
  StockRecommendation,
} from '../services/user.service';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  standalone: false,
})
export class FolderPage implements OnInit {
  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);

  // User management properties
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  sortBy: string = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  filterBy: string = 'all';

  // Stock recommendation properties
  selectedUser: User | null = null;
  stockRecommendation: Partial<StockRecommendation> = {
    stockSymbol: '',
    stockName: '',
    recommendation: 'BUY',
    targetPrice: 0,
    currentPrice: 0,
    reason: '',
  };

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Subscription recommendations modal
  isSubscriptionModalOpen = false;
  selectedSubscription: {
    user: User;
    subscription: string;
    userName: string;
  } | null = null;
  subscriptionRecommendations: StockRecommendation[] = [];

  // Computed properties for template
  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter((user) => user.isActive).length;
  }

  get wealthBuilderUsers(): number {
    return this.users.filter((user) =>
      user.purchasedSubscriptions.includes('wealth-builder')
    ).length;
  }

  get filteredUsersCount(): number {
    return this.filteredUsers.length;
  }

  constructor(
    private menuController: MenuController,
    private userService: UserService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router
  ) {
    this.menuController.enable(true);
  }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
    this.loadUsers();
  }

  async loadUsers() {
    const loading = await this.loadingController.create({
      message: 'Loading users...',
    });
    await loading.present();

    try {
      const response: any = await this.userService.getUsers().toPromise();
      
      // Log the complete raw Firebase response
      console.log('=== COMPLETE FIREBASE RESPONSE ===');
      console.log('Full response object:', response);
      console.log('Documents array:', response.documents);
      
      // Log each raw document from Firebase
      if (response.documents) {
        response.documents.forEach((doc: any, index: number) => {
          console.log(`=== RAW FIREBASE DOCUMENT ${index + 1} ===`);
          console.log('Document name:', doc.name);
          console.log('Document fields:', doc.fields);
          console.log('Complete document object:', doc);
          console.log('=== END RAW DOCUMENT ${index + 1} ===');
        });
      }
      
      this.users =
        response.documents?.map((doc: any) =>
          this.userService.convertFirestoreToUser(doc)
        ) || [];
      this.applyFilters();
      
      // Log converted users list to console
      this.logUsersToConsole();
    } catch (error) {
      console.error('Error loading users:', error);
      this.presentToast('Error loading users', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  logUsersToConsole() {
    console.log('=== USERS LIST ===');
    console.log('Total users:', this.users.length);
    console.log('Users data:', this.users);
    
    // Log each user individually for better readability
    this.users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        aadhaarVerified: user.aadhaarVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        updatedAt: user.updatedAt,
        password: user.password,
        panNumber: user.panNumber,
        agreementUrls: user.agreementUrls,
        subscriptionDetails: user.subscriptionDetails,
        purchasedSubscriptions: user.purchasedSubscriptions
      });
    });
    
    console.log('=== END USERS LIST ===');
    
    // Show toast notification
    this.presentToast(`Users list logged to console (${this.users.length} users)`, 'success');
  }

  async logCompleteFirebaseData() {
    const loading = await this.loadingController.create({
      message: 'Fetching Firebase data...',
    });
    await loading.present();

    try {
      const response: any = await this.userService.getUsers().toPromise();
      
      // Log the complete raw Firebase response
      console.log('=== COMPLETE FIREBASE RESPONSE ===');
      console.log('Full response object:', response);
      console.log('Documents array:', response.documents);
      
      // Log each raw document from Firebase
      if (response.documents) {
        response.documents.forEach((doc: any, index: number) => {
          console.log(`=== RAW FIREBASE DOCUMENT ${index + 1} ===`);
          console.log('Document name:', doc.name);
          console.log('Document fields:', doc.fields);
          console.log('Complete document object:', doc);
          console.log('=== END RAW DOCUMENT ${index + 1} ===');
        });
      }
      
      console.log('=== END COMPLETE FIREBASE RESPONSE ===');
      this.presentToast('Complete Firebase data logged to console', 'success');
    } catch (error) {
      console.error('Error fetching Firebase data:', error);
      this.presentToast('Error fetching Firebase data', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async downloadAgreementPDF(agreement: any, userName: string) {
    if (!agreement.downloadUrl) {
      this.presentToast('No PDF available for this agreement', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Downloading Agreement PDF...',
    });
    await loading.present();

    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = agreement.downloadUrl;
      link.download = `${userName}_${agreement.fileName}`;
      link.target = '_blank';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.presentToast(`Agreement PDF downloaded for ${userName}`, 'success');
    } catch (error) {
      console.error('Error downloading agreement PDF:', error);
      this.presentToast('Failed to download agreement PDF', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async downloadUserPDF(user: User) {
    // This method is kept for backward compatibility
    if (!user.agreementUrls || user.agreementUrls.length === 0) {
      this.presentToast('No agreements available for this user', 'warning');
      return;
    }

    // Download the first agreement if multiple exist
    const firstAgreement = user.agreementUrls[0];
    await this.downloadAgreementPDF(firstAgreement, user.name);
  }

  applyFilters() {
    let filtered = [...this.users];

    // Search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.phoneNumber.includes(searchLower)
      );
    }

    // Subscription filter
    if (this.filterBy !== 'all') {
      filtered = filtered.filter((user) =>
        user.purchasedSubscriptions.includes(this.filterBy)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a[this.sortBy as keyof User];
          bValue = b[this.sortBy as keyof User];
      }

      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredUsers = filtered;
    this.currentPage = 1;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  async openStockRecommendationModal(user: User) {
    this.selectedUser = user;
    this.stockRecommendation = {
      userId: user.uid,
      stockSymbol: '',
      stockName: '',
      recommendation: 'BUY',
      targetPrice: 0,
      currentPrice: 0,
      reason: '',
      createdBy: 'admin', // You can get this from auth service
    };

    const alert = await this.alertController.create({
      header: `Stock Recommendation for ${user.name}`,
      inputs: [
        {
          name: 'stockSymbol',
          type: 'text',
          placeholder: 'Stock Symbol (e.g., AAPL)',
          value: this.stockRecommendation.stockSymbol,
        },
        {
          name: 'stockName',
          type: 'text',
          placeholder: 'Stock Name (e.g., Apple Inc.)',
          value: this.stockRecommendation.stockName,
        },
        {
          name: 'recommendation',
          type: 'text',
          placeholder: 'Recommendation (BUY/SELL/HOLD)',
          value: this.stockRecommendation.recommendation,
        },
        {
          name: 'currentPrice',
          type: 'number',
          placeholder: 'Current Price',
          value: this.stockRecommendation.currentPrice,
        },
        {
          name: 'targetPrice',
          type: 'number',
          placeholder: 'Target Price',
          value: this.stockRecommendation.targetPrice,
        },
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Reason for recommendation',
          value: this.stockRecommendation.reason,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Send Recommendation',
          handler: (data) => {
            this.sendStockRecommendation(data);
          },
        },
      ],
    });

    await alert.present();
  }

  async sendStockRecommendation(data: any) {
    console.log('=== SENDING STOCK RECOMMENDATION ===');
    console.log('Form data received:', data);
    console.log('Selected user:', this.selectedUser);

    const loading = await this.loadingController.create({
      message: 'Sending recommendation...',
    });
    await loading.present();

    try {
      if (!this.selectedUser) {
        throw new Error('No user selected');
      }

      // Validate form data
      if (!data.stockSymbol || !data.stockName || !data.recommendation) {
        throw new Error('Please fill in all required fields');
      }

      if (!data.currentPrice || !data.targetPrice) {
        throw new Error('Please enter valid prices');
      }

        const recommendation: Omit<StockRecommendation, 'id' | 'createdAt'> = {
        userId: this.selectedUser.uid,
        stockSymbol: data.stockSymbol.trim(),
        stockName: data.stockName.trim(),
        stockExchange: 'NSE', // Default to NSE
        term: 'mid', // Default to mid-term
        recommendation: data.recommendation.trim().toUpperCase(),
        date: new Date().toISOString(), // Current date
        currentPrice: parseFloat(data.currentPrice),
        targetHit: false,
        stoplossHit: false,
          profitEarned: '',
        isMarkedForDeletion: false,
        targetPrice: parseFloat(data.targetPrice),
        entryPrice: parseFloat(data.currentPrice), // Use currentPrice as entryPrice for now
        entryRangeMin: parseFloat(data.currentPrice) * 0.95, // 5% below current price
        entryRangeMax: parseFloat(data.currentPrice) * 1.05, // 5% above current price
        stoploss: parseFloat(data.currentPrice) * 0.9, // Default 10% stop loss
        potentialLeftPct:
          ((parseFloat(data.targetPrice) - parseFloat(data.currentPrice)) /
            parseFloat(data.currentPrice)) *
          100, // Calculate potential %
        durationText: '3-6 months', // Default duration
        actions: [], // No actions initially
        alerts: [], // No alerts initially
        reason: data.reason?.trim() || '',
        createdBy: 'admin',
      };

      console.log('Recommendation object to save:', recommendation);

      const result = await this.userService.addStockRecommendation(
        recommendation
      );
      console.log('Recommendation saved successfully:', result);

      this.presentToast('Stock recommendation sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending recommendation:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      this.presentToast(
        'Error sending recommendation: ' + (error as Error).message,
        'danger'
      );
    } finally {
      await loading.dismiss();
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
    });
    await toast.present();
  }

  getPaginatedUsers() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  getTotalPages() {
    return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  formatDate(dateString: string) {
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

  openStockRecommendationEditor() {
    this.router.navigate(['/admin/stock-ideas/new']);
  }

  openAllRecommendations() {
    this.router.navigate(['/recommendations']);
  }

  openFirestoreTest() {
    // Open browser console and test Firestore connection
    console.log('=== FIRESTORE CONNECTION TEST ===');

    // Test 1: Check if we can reach Firestore
    fetch(
      'https://firestore.googleapis.com/v1/projects/travestingmoney-5d9f9/databases/(default)/documents?key=AIzaSyCV8_CE8XH_OXyIhtUrejvvH4BRFmfpf9Y'
    )
      .then((response) => {
        console.log(
          'Firestore connection test:',
          response.status,
          response.statusText
        );
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      })
      .then((data) => {
        console.log('Available collections:', data);
      })
      .catch((error) => {
        console.error('Firestore connection failed:', error);
      });

    // Test 2: Try to add a test recommendation
    const testRecommendation: Omit<StockRecommendation, 'id' | 'createdAt'> = {
      userId: 'test-user-123',
      stockSymbol: 'TEST',
      stockName: 'Test Company',
      stockExchange: 'NSE', // Default to NSE
      term: 'mid', // Default to mid-term
      recommendation: 'BUY' as 'BUY' | 'SELL' | 'HOLD',
      date: new Date().toISOString(), // Current date
      currentPrice: 100,
      targetPrice: 120,
      targetHit: false,
      stoplossHit: false,
        profitEarned: '',
      isMarkedForDeletion: false,
      entryPrice: 100, // Use same as currentPrice for test
      entryRangeMin: 95, // 5% below current price
      entryRangeMax: 105, // 5% above current price
      stoploss: 90, // 10% stop loss
      potentialLeftPct: 20, // 20% potential gain
      durationText: '3-6 months', // Default duration
      actions: [], // No actions initially
      alerts: [], // No alerts initially
      reason: 'Test recommendation',
      createdBy: 'admin',
    };

    this.userService
      .addStockRecommendation(testRecommendation)
      .then((result) => {
        console.log('Test recommendation added successfully:', result);
        this.presentToast('Test data added successfully!', 'success');
      })
      .catch((error) => {
        console.error('Failed to add test recommendation:', error);
        this.presentToast(
          'Failed to add test data: ' + error.message,
          'danger'
        );
      });
  }

  testStockRecommendationForm() {
    console.log('=== TESTING STOCK RECOMMENDATION FORM ===');

    // Simulate form data as it would come from the alert
    const mockFormData = {
      stockSymbol: 'AAPL',
      stockName: 'Apple Inc.',
      recommendation: 'BUY',
      currentPrice: '150.50',
      targetPrice: '175.00',
      reason: 'Strong quarterly earnings and growth potential',
    };

    console.log('Mock form data:', mockFormData);

    // Set a mock selected user
    if (this.users.length > 0) {
      this.selectedUser = this.users[0];
      console.log('Using first user as selected user:', this.selectedUser);

      // Call the sendStockRecommendation method with mock data
      this.sendStockRecommendation(mockFormData);
    } else {
      console.error('No users available for testing');
      this.presentToast('No users available for testing', 'danger');
    }
  }

  openStockIdeaEditor(user: User) {
    // Navigate to stock idea editor with user context
    this.router.navigate(['/admin/stock-ideas/new'], {
      queryParams: { userId: user.uid, userName: user.name },
    });
  }

  openSubscriptionRecommendations(user: User, subscription: string) {
    this.selectedSubscription = {
      user,
      subscription,
      userName: user.name,
    };
    this.loadSubscriptionRecommendations(user.uid, subscription);
    this.isSubscriptionModalOpen = true;
  }

  closeSubscriptionModal() {
    this.isSubscriptionModalOpen = false;
    this.selectedSubscription = null;
    this.subscriptionRecommendations = [];
  }

  async loadSubscriptionRecommendations(userId: string, subscription: string) {
    try {
      // Load recommendations for the specific user
      this.subscriptionRecommendations =
        await this.userService.getStockRecommendationsByUser(userId);
    } catch (error) {
      console.error('Error loading subscription recommendations:', error);
      await this.presentToast('Failed to load recommendations', 'danger');
      this.subscriptionRecommendations = [];
    }
  }

  getRecommendationCount(type: 'BUY' | 'SELL'): number {
    return this.subscriptionRecommendations.filter(
      (rec) => rec.recommendation === type
    ).length;
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

      // Remove from local array
      this.subscriptionRecommendations =
        this.subscriptionRecommendations.filter(
          (rec) => rec.id !== recommendation.id
        );

      await loading.dismiss();
      await this.presentToast('Recommendation deleted successfully', 'success');
    } catch (error) {
      await loading.dismiss();
      await this.presentToast('Failed to delete recommendation', 'danger');
    }
  }
}
