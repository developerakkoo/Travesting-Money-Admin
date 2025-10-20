import { Component, OnInit } from '@angular/core';
import { ContactsService } from '../services/contacts.service';
import {
  LoadingController,
  AlertController,
  ToastController,
} from '@ionic/angular';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  service: string;
  source: string;
  status: string;
  timestamp: any;
}

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.page.html',
  styleUrls: ['./contacts.page.scss'],
  standalone: false,
})
export class ContactsPage implements OnInit {
  contacts: Contact[] = [];

  constructor(
    private contactsService: ContactsService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadContacts();
  }

  async loadContacts() {
    const loading = await this.loadingController.create({
      message: 'Loading contacts...',
    });
    await loading.present();

    try {
      const response: any = await this.contactsService
        .getContacts()
        .toPromise();
      this.contacts = this.mapFirestoreResponse(response.documents || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      this.showToast('Error loading contacts', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private mapFirestoreResponse(documents: any[]): Contact[] {
    return documents.map((doc) => {
      const fields = doc.fields;
      return {
        id: doc.name.split('/').pop(),
        name: fields.name?.stringValue || '',
        email: fields.email?.stringValue || '',
        phone: fields.phone?.stringValue || '',
        message: fields.message?.stringValue || '',
        service: fields.service?.stringValue || '',
        source: fields.source?.stringValue || '',
        status: fields.status?.stringValue || 'new',
        timestamp:
          fields.timestamp?.timestampValue ||
          fields.createdAt?.timestampValue ||
          new Date().toISOString(),
      };
    });
  }

  async deleteContact(contact: Contact) {
    const alert = await this.alertController.create({
      header: 'Delete Contact',
      message: `Are you sure you want to delete the contact from ${contact.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          handler: async () => {
            await this.performDelete(contact);
          },
        },
      ],
    });

    await alert.present();
  }

  private async performDelete(contact: Contact) {
    const loading = await this.loadingController.create({
      message: 'Deleting contact...',
    });
    await loading.present();

    try {
      await this.contactsService
        .deleteContact(`contacts/${contact.id}`)
        .toPromise();
      this.contacts = this.contacts.filter((c) => c.id !== contact.id);
      this.showToast('Contact deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting contact:', error);
      this.showToast('Error deleting contact', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async showContactDetails(contact: Contact) {
    const alert = await this.alertController.create({
      header: 'Contact Details',
      message: `
        <div style="text-align: left;">
          <p><strong>Name:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Phone:</strong> ${contact.phone}</p>
          <p><strong>Service:</strong> ${contact.service}</p>
          <p><strong>Source:</strong> ${contact.source}</p>
          <p><strong>Status:</strong> ${contact.status}</p>
          <p><strong>Message:</strong></p>
          <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; background: #f9f9f9;">
            ${contact.message}
          </div>
          <p><strong>Date:</strong> ${new Date(
            contact.timestamp
          ).toLocaleString()}</p>
        </div>
      `,
      buttons: ['Close'],
    });

    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top',
    });
    await toast.present();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'new':
        return 'primary';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'closed':
        return 'medium';
      default:
        return 'primary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'new':
        return 'mail-unread';
      case 'in_progress':
        return 'time';
      case 'completed':
        return 'checkmark-circle';
      case 'closed':
        return 'close-circle';
      default:
        return 'mail';
    }
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }

  trackByContactId(index: number, contact: Contact): string {
    return contact.id;
  }
}
