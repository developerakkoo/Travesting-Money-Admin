import { Component } from '@angular/core';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-firestore-test',
  template: `
    <div style="padding: 20px;">
      <h2>Firestore Test</h2>
      <button (click)="testConnection()">Test Connection</button>
      <button (click)="testAddData()">Test Add Data</button>
      <button (click)="testGetData()">Test Get Data</button>

      <div
        *ngIf="result"
        style="margin-top: 20px; padding: 10px; background: #f0f0f0;"
      >
        <h3>Result:</h3>
        <pre>{{ result }}</pre>
      </div>

      <div
        *ngIf="error"
        style="margin-top: 20px; padding: 10px; background: #ffebee; color: red;"
      >
        <h3>Error:</h3>
        <pre>{{ error }}</pre>
      </div>
    </div>
  `,
})
export class FirestoreTestComponent {
  result: any = null;
  error: any = null;

  constructor(private userService: UserService) {}

  async testConnection() {
    try {
      this.error = null;
      this.result = 'Testing connection...';

      // Test basic connection
      const response = await fetch(
        'https://firestore.googleapis.com/v1/projects/travestingmoney-5d9f9/databases/(default)/documents?key=AIzaSyCV8_CE8XH_OXyIhtUrejvvH4BRFmfpf9Y'
      );

      if (response.ok) {
        const data = await response.json();
        this.result =
          'Connection successful! Available collections: ' +
          JSON.stringify(data, null, 2);
      } else {
        this.error = `Connection failed: ${response.status} ${response.statusText}`;
      }
    } catch (err) {
      this.error = 'Connection error: ' + JSON.stringify(err, null, 2);
    }
  }

  async testAddData() {
    try {
      this.error = null;
      this.result = 'Testing add data...';

      const testRecommendation = {
        userId: 'test-user-123',
        stockSymbol: 'TEST',
        stockName: 'Test Company',
        recommendation: 'BUY',
        currentPrice: 100,
        targetPrice: 120,
        reason: 'Test recommendation',
        createdBy: 'admin',
      };

      const result = await this.userService.addStockRecommendation(
        testRecommendation
      );
      this.result =
        'Data added successfully: ' + JSON.stringify(result, null, 2);
    } catch (err) {
      this.error = 'Add data error: ' + JSON.stringify(err, null, 2);
    }
  }

  async testGetData() {
    try {
      this.error = null;
      this.result = 'Testing get data...';

      const recommendations = await this.userService.getStockRecommendations();
      this.result =
        'Data retrieved successfully: ' +
        JSON.stringify(recommendations, null, 2);
    } catch (err) {
      this.error = 'Get data error: ' + JSON.stringify(err, null, 2);
    }
  }
}
