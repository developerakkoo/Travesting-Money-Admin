import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { Editor, Toolbar } from 'ngx-editor';
import { BlogService } from '../services/blog.service';
import { BlogFormData } from '../models/blog.model';

@Component({
  selector: 'app-blog-editor',
  templateUrl: './blog-editor.page.html',
  styleUrls: ['./blog-editor.page.scss'],
  standalone: false,
})
export class BlogEditorPage implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  
  html = '';
  title = '';
  imageUrl = '';
  selectedImage: File | null = null;
  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic', 'underline', 'strike'], // basic styles
    ['blockquote', 'code'],
    ['ordered_list', 'bullet_list', 'horizontal_rule'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'], // image & links
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];
  constructor(
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private blogService: BlogService
  ) {}
  ngOnInit() {
    this.editor = new Editor();
  }

  ionViewWillEnter() {}
  ngOnDestroy(): void {
    this.editor.destroy();
  }

  async presentToast(msg: string, color: string, duration: number) {
    const toast = await this.toastController.create({
      message: msg,
      color: color,
      duration: duration,
    });
    toast.present();
  }

  async blogPublishAlertConfirm(msg: string) {
    const alert = await this.alertController.create({
      header: 'Confirm!',
      message: 'Do you want to publish this blog post!!!',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel: blah');
          },
        },
        {
          text: 'Okay',
          handler: () => {
            console.log('Confirm Okay');
          },
        },
      ],
    });

    await alert.present();
  }
  getTitleFromHTML(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const h1 = doc.querySelector('h1');
    return h1?.textContent?.trim() || 'Untitled';
  }
  async upload() {
    const loading = await this.loadingController.create({
      message: 'Publishing blog...',
    });
    await loading.present();

    try {
      let imageUrl = this.imageUrl;

      // Upload image first if one is selected
      if (this.selectedImage) {
        imageUrl = await this.uploadImage();
      }

      const blog: BlogFormData = {
        title: this.getTitleFromHTML(this.html),
        content: this.html,
        imageUrl: imageUrl,
      };

      this.blogService.addBlog(blog).subscribe({
        next: () => {
          loading.dismiss();
          this.presentToast('Blog published successfully!', 'success', 3000);
          this.clearEditor();
        },
        error: (error) => {
          loading.dismiss();
          console.error('Blog upload error:', error);
          this.presentToast('Failed to publish blog', 'danger', 3000);
        },
      });
    } catch (error) {
      loading.dismiss();
      console.error('Upload error:', error);
      this.presentToast('Failed to upload image', 'danger', 3000);
    }
  }

  async uploadImage(): Promise<string> {
    if (!this.selectedImage) {
      throw new Error('No image selected');
    }

    return new Promise((resolve, reject) => {
      this.blogService
        .uploadBlogImage(this.selectedImage!)
        .subscribe({
          next: (url) => resolve(url),
          error: (error) => reject(error),
        });
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.presentToast('Please select a valid image file', 'danger', 3000);
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.presentToast('Image size must be less than 5MB', 'danger', 3000);
        return;
      }

      this.selectedImage = file;
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
      
      this.presentToast('Image selected successfully', 'success', 2000);
    }
  }

  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  removeImage() {
    this.selectedImage = null;
    this.imageUrl = '';
    this.presentToast('Image removed', 'success', 2000);
  }

  clearEditor() {
    this.html = '';
    this.imageUrl = '';
    this.selectedImage = null;
  }

  previewBlog() {
    // You can implement a preview modal here
    console.log('Preview blog:', this.html);
  }
}
