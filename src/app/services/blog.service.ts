import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Blog, BlogFormData } from '../models/blog.model';
import { environment } from '../../environments/environment';

const PROJECT_ID = 'travestingmoney-5d9f9';
const API_KEY = 'AIzaSyCV8_CE8XH_OXyIhtUrejvvH4BRFmfpf9Y';

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
@Injectable({
  providedIn: 'root'
})
export class BlogService {

   constructor(private http: HttpClient) {}

  addBlog(blog: BlogFormData) {
    const url = `${BASE_URL}/blogs?key=${API_KEY}`;
    const payload = {
      fields: {
        title: { stringValue: blog.title },
        content: { stringValue: blog.content },
        imageUrl: { stringValue: blog.imageUrl || '' },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    };
    return this.http.post(url, payload);
  }

  getBlogs() {
    const url = `${BASE_URL}/blogs?key=${API_KEY}`;
    return this.http.get(url);
  }

  // 🔁 UPDATE a blog
  updateBlog(documentPath: string, updatedData: BlogFormData) {
    const baseUrl = `${BASE_URL}/${documentPath}?key=${API_KEY}`;

    const fields: any = {
      title: { stringValue: updatedData.title },
      content: { stringValue: updatedData.content },
      updatedAt: { timestampValue: new Date().toISOString() },
    };

    const fieldPaths: string[] = ['title', 'content', 'updatedAt'];

    if (updatedData.imageUrl !== undefined) {
      fields.imageUrl = { stringValue: updatedData.imageUrl };
      fieldPaths.push('imageUrl');
    }

    const updateMask = fieldPaths
      .map((path) => `updateMask.fieldPaths=${encodeURIComponent(path)}`)
      .join('&');

    const url = `${baseUrl}&${updateMask}`;

    const payload = {
      fields,
    };

    return this.http.patch(url, payload);
  }

  // ❌ DELETE a blog
  deleteBlog(documentPath: string) {
    const url = `${BASE_URL}/${documentPath}?key=${API_KEY}`;
    return this.http.delete(url);
  }
  getBlogById(documentId: string) {
    const url = `${BASE_URL}/blogs/${documentId}?key=${API_KEY}`;
    return this.http.get(url);
  }

  /**
   * Upload blog image to server
   * @param file The image file to upload
   * @returns Observable that emits the full image URL string
   */
  uploadBlogImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);

    const url = `${environment.apiUrl}/api/blogs/upload-image`;

    return this.http.post<{ success: boolean; data: { imageUrl: string } }>(url, formData).pipe(
      map((response) => {
        if (response.success && response.data.imageUrl) {
          // Construct full URL if the response provides a relative path
          const imageUrl = response.data.imageUrl;
          if (imageUrl.startsWith('/')) {
            return `${environment.apiUrl}${imageUrl}`;
          }
          return imageUrl;
        }
        throw new Error('Failed to upload image');
      })
    );
  }
}
