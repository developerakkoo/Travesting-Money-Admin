import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
const PROJECT_ID = 'travesting-3a43e';
const API_KEY = 'AIzaSyBZlk1Mxmgc6dtQKvA0KUWZDJO8E3wr8ZM';

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
@Injectable({
  providedIn: 'root'
})
export class BlogService {

   constructor(private http: HttpClient) {}

  addBlog(blog: any) {
    const url = `${BASE_URL}/blogs?key=${API_KEY}`;
    const payload = {
      fields: {
        title: { stringValue: blog.title },
        content: { stringValue: blog.content },
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
  updateBlog(documentPath: string, updatedData: { title: string; content: string }) {
    const url = `${BASE_URL}/${documentPath}?key=${API_KEY}`;
    const payload = {
      fields: {
        title: { stringValue: updatedData.title },
        content: { stringValue: updatedData.content },
        updatedAt: { timestampValue: new Date().toISOString() }
      }
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
}
