import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

const PROJECT_ID = 'travestingmoney-5d9f9';
const API_KEY = 'AIzaSyCV8_CE8XH_OXyIhtUrejvvH4BRFmfpf9Y';

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

@Injectable({
  providedIn: 'root',
})
export class ContactsService {
  constructor(private http: HttpClient) {}

  getContacts() {
    const url = `${BASE_URL}/contacts?key=${API_KEY}`;
    return this.http.get(url);
  }

  getContactById(documentId: string) {
    const url = `${BASE_URL}/contacts/${documentId}?key=${API_KEY}`;
    return this.http.get(url);
  }

  updateContactStatus(documentPath: string, status: string) {
    const url = `${BASE_URL}/${documentPath}?key=${API_KEY}`;
    const payload = {
      fields: {
        status: { stringValue: status },
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    };
    return this.http.patch(url, payload);
  }

  deleteContact(documentPath: string) {
    const url = `${BASE_URL}/${documentPath}?key=${API_KEY}`;
    return this.http.delete(url);
  }
}
