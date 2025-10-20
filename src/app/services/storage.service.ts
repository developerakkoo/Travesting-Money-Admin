import { Injectable } from '@angular/core';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage = getStorage();

  constructor() {}

  /**
   * Upload a file to Firebase Storage
   * @param file The file to upload
   * @param path The path where to store the file (e.g., 'stock-images/', 'research-reports/')
   * @param fileName Optional custom file name. If not provided, will use original file name with timestamp
   * @returns Observable that emits the download URL when upload is complete
   */
  uploadFile(file: File, path: string, fileName?: string): Observable<string> {
    // Generate unique file name if not provided
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const finalFileName =
      fileName || `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Create the file path
    const filePath = `${path}${finalFileName}`;

    // Create storage reference
    const fileRef = ref(this.storage, filePath);

    return new Observable((observer) => {
      // Upload the file
      uploadBytes(fileRef, file)
        .then((snapshot) => {
          // Get download URL after upload is complete
          return getDownloadURL(snapshot.ref);
        })
        .then((downloadURL) => {
          observer.next(downloadURL);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  /**
   * Upload an image file with validation
   * @param file The image file to upload
   * @param path The path where to store the image
   * @param fileName Optional custom file name
   * @returns Observable that emits the download URL when upload is complete
   */
  uploadImage(
    file: File,
    path: string = 'stock-images/',
    fileName?: string
  ): Observable<string> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image file size must be less than 5MB');
    }

    return this.uploadFile(file, path, fileName);
  }

  /**
   * Upload a research report file with validation
   * @param file The document file to upload
   * @param path The path where to store the document
   * @param fileName Optional custom file name
   * @returns Observable that emits the download URL when upload is complete
   */
  uploadResearchReport(
    file: File,
    path: string = 'research-reports/',
    fileName?: string
  ): Observable<string> {
    // Validate file type (allow common document formats)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        'File must be a PDF, Word document, Excel file, or text file'
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Document file size must be less than 10MB');
    }

    return this.uploadFile(file, path, fileName);
  }

  /**
   * Delete a file from Firebase Storage
   * @param url The download URL of the file to delete
   */
  deleteFile(url: string): Observable<void> {
    return new Observable((observer) => {
      try {
        // Create a reference from the download URL
        const fileRef = ref(this.storage, url);

        // Delete the file
        deleteObject(fileRef)
          .then(() => {
            observer.next();
            observer.complete();
          })
          .catch((error) => {
            observer.error(error);
          });
      } catch (error) {
        observer.error(error);
      }
    });
  }
}
