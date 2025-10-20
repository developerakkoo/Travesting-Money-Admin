import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const PROJECT_ID = environment.firebaseConfig.projectId;
const API_KEY = environment.firebaseConfig.apiKey;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export interface User {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  purchasedSubscriptions: string[];
  aadhaarNumber?: string;
  aadhaarVerificationDate?: string;
  aadhaarVerified: boolean;
  isActive: boolean;
  lastLoginAt: string;
  updatedAt: string;
}

export interface TradeAction {
  id: string;
  type: 'AVERAGING' | 'PARTIAL_BOOKING';
  date: string;
  entryPrice: number;
  entryRangeMin: number;
  entryRangeMax: number;
  note?: string;
}

export interface StockRecommendation {
  id?: string;
  userId: string;
  stockSymbol: string;
  stockName: string;
  stockExchange: 'NSE' | 'BSE'; // Stock Exchange
  term: 'short' | 'mid' | 'long'; // Investment term
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  cmp?: number; // Current Market Price
  changePct?: number; // Change percentage
  date: string; // Entry date
  targetPrice: number;
  currentPrice: number;
  entryPrice: number; // Entry price for the recommendation
  entryRangeMin: number; // Minimum entry price range
  entryRangeMax: number; // Maximum entry price range
  stoploss: number; // Stoploss price
  potentialLeftPct: number; // Potential percentage left
  durationText: string; // Duration text (e.g., "1-3 months")
  actions: TradeAction[]; // Array of trade actions (averaging, partial booking)
  alerts: string[]; // Array of alert messages
  reason: string;
  imageUrl?: string; // URL of the uploaded stock image
  researchReportUrl?: string; // URL of the uploaded research report
  createdAt: string;
  createdBy: string;
}

export interface Holding {
  id?: string;
  name: string;
  sector: string;
  instrument: string;
  percentageOfHoldings: number;
  createdAt: string;
  createdBy: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  // Get all users
  getUsers() {
    const url = `${BASE_URL}/users?key=${API_KEY}`;
    return this.http.get(url);
  }

  // Get user by ID
  getUserById(userId: string) {
    const url = `${BASE_URL}/users/${userId}?key=${API_KEY}`;
    return this.http.get(url);
  }

  // Update user
  updateUser(userId: string, userData: Partial<User>) {
    const url = `${BASE_URL}/users/${userId}?key=${API_KEY}`;
    const payload = {
      fields: this.convertToFirestoreFields(userData),
    };
    return this.http.patch(url, payload);
  }

  // Helper method to convert object to Firestore fields format
  private convertToFirestoreFields(data: any): any {
    const fields: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'string') {
          fields[key] = { stringValue: value };
        } else if (typeof value === 'number') {
          fields[key] = { doubleValue: value };
        } else if (typeof value === 'boolean') {
          fields[key] = { booleanValue: value };
        } else if (Array.isArray(value)) {
          fields[key] = {
            arrayValue: { values: value.map((v) => ({ stringValue: v })) },
          };
        } else if (value instanceof Date) {
          fields[key] = { timestampValue: value.toISOString() };
        }
      }
    }

    return fields;
  }

  // Helper method to convert Firestore response to User object
  convertFirestoreToUser(doc: any): User {
    const fields = doc.fields;
    return {
      uid: doc.name.split('/').pop(),
      name: fields.name?.stringValue || '',
      email: fields.email?.stringValue || '',
      phoneNumber: fields.phoneNumber?.stringValue || '',
      createdAt: fields.createdAt?.timestampValue || '',
      purchasedSubscriptions:
        fields.purchasedSubscriptions?.arrayValue?.values?.map(
          (v: any) => v.stringValue
        ) || [],
      aadhaarNumber: fields.aadhaarNumber?.stringValue,
      aadhaarVerificationDate: fields.aadhaarVerificationDate?.timestampValue,
      aadhaarVerified: fields.aadhaarVerified?.booleanValue || false,
      isActive: fields.isActive?.booleanValue || true,
      lastLoginAt: fields.lastLoginAt?.timestampValue || '',
      updatedAt: fields.updatedAt?.timestampValue || '',
    };
  }

  // Stock Recommendation CRUD operations
  async addStockRecommendation(
    recommendation: Omit<StockRecommendation, 'id' | 'createdAt'>
  ): Promise<StockRecommendation> {
    try {
      const url = `${BASE_URL}/stockRecommendations?key=${API_KEY}`;
      const payload: any = {
        fields: {
          userId: { stringValue: recommendation.userId },
          stockSymbol: { stringValue: recommendation.stockSymbol },
          stockName: { stringValue: recommendation.stockName },
          stockExchange: { stringValue: recommendation.stockExchange },
          term: { stringValue: recommendation.term },
          recommendation: { stringValue: recommendation.recommendation },
          date: { stringValue: recommendation.date },
          targetPrice: { doubleValue: recommendation.targetPrice },
          currentPrice: { doubleValue: recommendation.currentPrice },
          entryPrice: { doubleValue: recommendation.entryPrice },
          entryRangeMin: { doubleValue: recommendation.entryRangeMin },
          entryRangeMax: { doubleValue: recommendation.entryRangeMax },
          stoploss: { doubleValue: recommendation.stoploss },
          potentialLeftPct: { doubleValue: recommendation.potentialLeftPct },
          durationText: { stringValue: recommendation.durationText },
          reason: { stringValue: recommendation.reason },
          createdBy: { stringValue: recommendation.createdBy },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      };

      // Add optional fields if they exist
      if (recommendation.cmp !== undefined && recommendation.cmp !== null) {
        payload.fields.cmp = { doubleValue: recommendation.cmp };
      }
      if (
        recommendation.changePct !== undefined &&
        recommendation.changePct !== null
      ) {
        payload.fields.changePct = { doubleValue: recommendation.changePct };
      }
      if (recommendation.imageUrl) {
        payload.fields.imageUrl = { stringValue: recommendation.imageUrl };
      }
      if (recommendation.researchReportUrl) {
        payload.fields.researchReportUrl = {
          stringValue: recommendation.researchReportUrl,
        };
      }

      // Add actions array
      if (recommendation.actions && recommendation.actions.length > 0) {
        payload.fields.actions = {
          arrayValue: {
            values: recommendation.actions.map((action: TradeAction) => ({
              mapValue: {
                fields: {
                  id: { stringValue: action.id },
                  type: { stringValue: action.type },
                  date: { stringValue: action.date },
                  entryPrice: { doubleValue: action.entryPrice },
                  entryRangeMin: { doubleValue: action.entryRangeMin },
                  entryRangeMax: { doubleValue: action.entryRangeMax },
                  note: { stringValue: action.note || '' },
                },
              },
            })),
          },
        };
      } else {
        payload.fields.actions = { arrayValue: { values: [] } };
      }

      // Add alerts array
      if (recommendation.alerts && recommendation.alerts.length > 0) {
        payload.fields.alerts = {
          arrayValue: {
            values: recommendation.alerts.map((alert: string) => ({
              stringValue: alert,
            })),
          },
        };
      } else {
        payload.fields.alerts = { arrayValue: { values: [] } };
      }

      console.log('Sending request to:', url);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = (await this.http.post(url, payload).toPromise()) as any;

      console.log('Response received:', response);

      return {
        id: response.name?.split('/').pop() || '',
        ...recommendation,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error adding stock recommendation:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async getStockRecommendations(): Promise<StockRecommendation[]> {
    try {
      const url = `${BASE_URL}/stockRecommendations?pageSize=1000&key=${API_KEY}`;
      console.log('Fetching recommendations from:', url);

      const response = (await this.http.get(url).toPromise()) as any;
      console.log('Get recommendations response:', response);

      return (
        response.documents?.map((doc: any) =>
          this.convertFirestoreToStockRecommendation(doc)
        ) || []
      );
    } catch (error) {
      console.error('Error fetching stock recommendations:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async getStockRecommendationsByUser(
    userId: string
  ): Promise<StockRecommendation[]> {
    try {
      const url = `${BASE_URL}/stockRecommendations?pageSize=1000&key=${API_KEY}`;
      const response = (await this.http.get(url).toPromise()) as any;
      const allRecommendations =
        response.documents?.map((doc: any) =>
          this.convertFirestoreToStockRecommendation(doc)
        ) || [];
      return allRecommendations.filter(
        (rec: StockRecommendation) => rec.userId === userId
      );
    } catch (error) {
      console.error('Error fetching user stock recommendations:', error);
      throw error;
    }
  }

  async getStockRecommendationsBySubscription(
    subscription: string
  ): Promise<StockRecommendation[]> {
    try {
      // First get users with the subscription
      const users = (await this.getUsers().pipe(take(1)).toPromise()) as User[];
      const usersWithSubscription = users.filter((user: User) =>
        user.purchasedSubscriptions.includes(subscription)
      );
      const userIds = usersWithSubscription.map((user: User) => user.uid);

      // Then get recommendations for those users
      const allRecommendations = await this.getStockRecommendations();
      return allRecommendations.filter((rec: StockRecommendation) =>
        userIds.includes(rec.userId)
      );
    } catch (error) {
      console.error(
        'Error fetching subscription stock recommendations:',
        error
      );
      throw error;
    }
  }

  async updateStockRecommendation(
    id: string,
    updates: Partial<StockRecommendation>
  ): Promise<StockRecommendation> {
    try {
      const url = `${BASE_URL}/stockRecommendations/${id}?key=${API_KEY}`;

      // Build the fields object manually to handle complex types
      const fields: any = {};

      // Handle simple string fields
      if (updates.userId !== undefined)
        fields.userId = { stringValue: updates.userId };
      if (updates.stockSymbol !== undefined)
        fields.stockSymbol = { stringValue: updates.stockSymbol };
      if (updates.stockName !== undefined)
        fields.stockName = { stringValue: updates.stockName };
      if (updates.stockExchange !== undefined)
        fields.stockExchange = { stringValue: updates.stockExchange };
      if (updates.term !== undefined)
        fields.term = { stringValue: updates.term };
      if (updates.recommendation !== undefined)
        fields.recommendation = { stringValue: updates.recommendation };
      if (updates.date !== undefined)
        fields.date = { stringValue: updates.date };
      if (updates.durationText !== undefined)
        fields.durationText = { stringValue: updates.durationText };
      if (updates.reason !== undefined)
        fields.reason = { stringValue: updates.reason };
      if (updates.createdBy !== undefined)
        fields.createdBy = { stringValue: updates.createdBy };

      // Handle numeric fields
      if (updates.cmp !== undefined && updates.cmp !== null) {
        fields.cmp = { doubleValue: updates.cmp };
      }
      if (updates.changePct !== undefined && updates.changePct !== null) {
        fields.changePct = { doubleValue: updates.changePct };
      }
      if (updates.currentPrice !== undefined)
        fields.currentPrice = { doubleValue: updates.currentPrice };
      if (updates.targetPrice !== undefined)
        fields.targetPrice = { doubleValue: updates.targetPrice };
      if (updates.entryPrice !== undefined)
        fields.entryPrice = { doubleValue: updates.entryPrice };
      if (updates.entryRangeMin !== undefined)
        fields.entryRangeMin = { doubleValue: updates.entryRangeMin };
      if (updates.entryRangeMax !== undefined)
        fields.entryRangeMax = { doubleValue: updates.entryRangeMax };
      if (updates.stoploss !== undefined)
        fields.stoploss = { doubleValue: updates.stoploss };
      if (updates.potentialLeftPct !== undefined)
        fields.potentialLeftPct = { doubleValue: updates.potentialLeftPct };

      // Handle optional fields
      if (updates.imageUrl !== undefined) {
        fields.imageUrl = { stringValue: updates.imageUrl };
      }
      if (updates.researchReportUrl !== undefined) {
        fields.researchReportUrl = { stringValue: updates.researchReportUrl };
      }

      // Handle actions array (array of objects)
      if (updates.actions !== undefined) {
        if (updates.actions && updates.actions.length > 0) {
          fields.actions = {
            arrayValue: {
              values: updates.actions.map((action: TradeAction) => ({
                mapValue: {
                  fields: {
                    id: { stringValue: action.id },
                    type: { stringValue: action.type },
                    date: { stringValue: action.date },
                    entryPrice: { doubleValue: action.entryPrice },
                    entryRangeMin: { doubleValue: action.entryRangeMin },
                    entryRangeMax: { doubleValue: action.entryRangeMax },
                    note: { stringValue: action.note || '' },
                  },
                },
              })),
            },
          };
        } else {
          fields.actions = { arrayValue: { values: [] } };
        }
      }

      // Handle alerts array (array of strings)
      if (updates.alerts !== undefined) {
        if (updates.alerts && updates.alerts.length > 0) {
          fields.alerts = {
            arrayValue: {
              values: updates.alerts.map((alert: string) => ({
                stringValue: alert,
              })),
            },
          };
        } else {
          fields.alerts = { arrayValue: { values: [] } };
        }
      }

      const updateData = { fields };

      console.log('Updating stock recommendation:', id);
      console.log('Update payload:', JSON.stringify(updateData, null, 2));

      const response = (await this.http
        .patch(url, updateData)
        .toPromise()) as any;
      return this.convertFirestoreToStockRecommendation(response);
    } catch (error) {
      console.error('Error updating stock recommendation:', error);
      throw error;
    }
  }

  async deleteStockRecommendation(id: string): Promise<void> {
    try {
      const url = `${BASE_URL}/stockRecommendations/${id}?key=${API_KEY}`;
      await this.http.delete(url).toPromise();
    } catch (error) {
      console.error('Error deleting stock recommendation:', error);
      throw error;
    }
  }

  private convertFirestoreToStockRecommendation(doc: any): StockRecommendation {
    const fields = doc.fields;

    // Parse actions array
    const actions: TradeAction[] = [];
    if (fields.actions?.arrayValue?.values) {
      for (const actionValue of fields.actions.arrayValue.values) {
        if (actionValue.mapValue?.fields) {
          const actionFields = actionValue.mapValue.fields;
          actions.push({
            id: actionFields.id?.stringValue || '',
            type:
              (actionFields.type?.stringValue as
                | 'AVERAGING'
                | 'PARTIAL_BOOKING') || 'AVERAGING',
            date: actionFields.date?.stringValue || '',
            entryPrice:
              actionFields.entryPrice?.doubleValue ||
              actionFields.entryPrice?.integerValue ||
              0,
            entryRangeMin:
              actionFields.entryRangeMin?.doubleValue ||
              actionFields.entryRangeMin?.integerValue ||
              0,
            entryRangeMax:
              actionFields.entryRangeMax?.doubleValue ||
              actionFields.entryRangeMax?.integerValue ||
              0,
            note: actionFields.note?.stringValue || '',
          });
        }
      }
    }

    // Parse alerts array
    const alerts: string[] = [];
    if (fields.alerts?.arrayValue?.values) {
      for (const alertValue of fields.alerts.arrayValue.values) {
        if (alertValue.stringValue) {
          alerts.push(alertValue.stringValue);
        }
      }
    }

    return {
      id: doc.name.split('/').pop(),
      userId: fields.userId?.stringValue || '',
      stockSymbol: fields.stockSymbol?.stringValue || '',
      stockName: fields.stockName?.stringValue || '',
      stockExchange:
        (fields.stockExchange?.stringValue as 'NSE' | 'BSE') || 'NSE',
      term: (fields.term?.stringValue as 'short' | 'mid' | 'long') || 'mid',
      recommendation:
        (fields.recommendation?.stringValue as 'BUY' | 'SELL' | 'HOLD') ||
        'HOLD',
      cmp: fields.cmp?.doubleValue || fields.cmp?.integerValue,
      changePct:
        fields.changePct?.doubleValue || fields.changePct?.integerValue,
      date: fields.date?.stringValue || '',
      currentPrice:
        fields.currentPrice?.doubleValue ||
        fields.currentPrice?.integerValue ||
        0,
      targetPrice:
        fields.targetPrice?.doubleValue ||
        fields.targetPrice?.integerValue ||
        0,
      entryPrice:
        fields.entryPrice?.doubleValue || fields.entryPrice?.integerValue || 0,
      entryRangeMin:
        fields.entryRangeMin?.doubleValue ||
        fields.entryRangeMin?.integerValue ||
        0,
      entryRangeMax:
        fields.entryRangeMax?.doubleValue ||
        fields.entryRangeMax?.integerValue ||
        0,
      stoploss:
        fields.stoploss?.doubleValue || fields.stoploss?.integerValue || 0,
      potentialLeftPct:
        fields.potentialLeftPct?.doubleValue ||
        fields.potentialLeftPct?.integerValue ||
        0,
      durationText: fields.durationText?.stringValue || '',
      actions: actions,
      alerts: alerts,
      reason: fields.reason?.stringValue || '',
      imageUrl: fields.imageUrl?.stringValue,
      researchReportUrl: fields.researchReportUrl?.stringValue,
      createdBy: fields.createdBy?.stringValue || '',
      createdAt: fields.createdAt?.stringValue || new Date().toISOString(),
    };
  }

  // Holdings CRUD operations
  async addHolding(
    holding: Omit<Holding, 'id' | 'createdAt'>
  ): Promise<Holding> {
    try {
      const url = `${BASE_URL}/holdings?key=${API_KEY}`;
      const payload = {
        fields: {
          name: { stringValue: holding.name },
          sector: { stringValue: holding.sector },
          instrument: { stringValue: holding.instrument },
          percentageOfHoldings: { doubleValue: holding.percentageOfHoldings },
          createdBy: { stringValue: holding.createdBy },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      };

      console.log('Sending holding request to:', url);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = (await this.http.post(url, payload).toPromise()) as any;

      console.log('Holding response received:', response);

      return {
        id: response.name?.split('/').pop() || '',
        ...holding,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error adding holding:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async getHoldings(): Promise<Holding[]> {
    try {
      const url = `${BASE_URL}/holdings?key=${API_KEY}`;
      const response = (await this.http.get(url).toPromise()) as any;

      if (!response.documents) {
        return [];
      }

      return response.documents.map((doc: any) =>
        this.convertFirestoreToHolding(doc)
      );
    } catch (error) {
      console.error('Error getting holdings:', error);
      throw error;
    }
  }

  async updateHolding(id: string, holding: Partial<Holding>): Promise<Holding> {
    try {
      const url = `${BASE_URL}/holdings/${id}?key=${API_KEY}`;
      const payload: any = {
        fields: {},
      };

      if (holding.name !== undefined) {
        payload.fields.name = { stringValue: holding.name };
      }
      if (holding.sector !== undefined) {
        payload.fields.sector = { stringValue: holding.sector };
      }
      if (holding.instrument !== undefined) {
        payload.fields.instrument = { stringValue: holding.instrument };
      }
      if (holding.percentageOfHoldings !== undefined) {
        payload.fields.percentageOfHoldings = {
          doubleValue: holding.percentageOfHoldings,
        };
      }

      const response = (await this.http.patch(url, payload).toPromise()) as any;
      return this.convertFirestoreToHolding(response);
    } catch (error) {
      console.error('Error updating holding:', error);
      throw error;
    }
  }

  async deleteHolding(id: string): Promise<void> {
    try {
      const url = `${BASE_URL}/holdings/${id}?key=${API_KEY}`;
      await this.http.delete(url).toPromise();
    } catch (error) {
      console.error('Error deleting holding:', error);
      throw error;
    }
  }

  private convertFirestoreToHolding(doc: any): Holding {
    const fields = doc.fields;
    return {
      id: doc.name.split('/').pop(),
      name: fields.name?.stringValue || '',
      sector: fields.sector?.stringValue || '',
      instrument: fields.instrument?.stringValue || '',
      percentageOfHoldings:
        fields.percentageOfHoldings?.doubleValue ||
        fields.percentageOfHoldings?.integerValue ||
        0,
      createdBy: fields.createdBy?.stringValue || '',
      createdAt: fields.createdAt?.stringValue || new Date().toISOString(),
    };
  }
}
