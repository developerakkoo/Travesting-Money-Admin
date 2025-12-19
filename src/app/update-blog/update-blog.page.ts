import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  LoadingController,
  ToastController,
  AlertController,
} from '@ionic/angular';
import { Editor, Toolbar } from 'ngx-editor';
import { BlogService } from '../services/blog.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogFormData } from '../models/blog.model';

@Component({
  selector: 'app-update-blog',
  templateUrl: './update-blog.page.html',
  styleUrls: ['./update-blog.page.scss'],
  standalone: false,
})
export class UpdateBlogPage implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  documentId: any;
  html = '';
  title = '';
  imageUrl = '';
  selectedImage: File | null = null;
  existingImageUrl = '';
  imageRemoved = false;
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
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private blogService: BlogService
  ) {
    this.documentId = this.route.snapshot.paramMap.get('id');
    console.log(this.documentId);
  }
  ngOnInit() {
    this.editor = new Editor();
  }

  ionViewWillEnter() {
    this.getBlogById(this.documentId);
  }
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
  getTitleFromHTML(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const h1 = doc.querySelector('h1');
    return h1?.textContent?.trim() || 'Untitled';
  }

  getBlogById(id: string) {
    const blogId = id.split('/')[1];
    this.blogService.getBlogById(blogId).subscribe((res: any) => {
      const blog = {
        id: res.name.split('/').pop(),
        title: res.fields.title.stringValue,
        content: res.fields.content.stringValue,
        imageUrl: res.fields.imageUrl?.stringValue || '',
        createdAt: res.fields.createdAt || res.fields.updatedAt,
      };
      console.log('Blog:', blog);
      this.html = blog.content;
      this.title = blog.title;
      this.imageUrl = blog.imageUrl || '';
      this.existingImageUrl = blog.imageUrl || '';
      this.selectedImage = null;
      this.imageRemoved = false;
      // You can display in editor or detail page
    });
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

  async upload() {
    const loading = await this.loadingController.create({
      message: 'Updating blog...',
    });
    await loading.present();

    try {
      let imageChanged = false;
      let finalImageUrl: string | undefined;

      if (this.selectedImage) {
        finalImageUrl = await this.uploadImage();
        imageChanged = true;
      } else if (this.imageRemoved) {
        finalImageUrl = '';
        imageChanged = true;
      }

      const blog: BlogFormData = {
        title: this.getTitleFromHTML(this.html),
        content: this.html,
      };

      if (imageChanged) {
        blog.imageUrl = finalImageUrl ?? '';
      }

      this.blogService.updateBlog(this.documentId, blog).subscribe({
        next: () => {
          loading.dismiss();
          if (imageChanged) {
            this.existingImageUrl = finalImageUrl ?? '';
            this.imageUrl = this.existingImageUrl;
            this.selectedImage = null;
            this.imageRemoved = !this.existingImageUrl;
          }
          this.presentToast('Blog updated', 'success', 2000);
          this.router.navigate(['blogs']);
        },
        error: (error) => {
          console.error('Blog update error:', error);
          loading.dismiss();
          this.presentToast('Upload failed', 'danger', 2000);
        },
      });
    } catch (error) {
      console.error('Error updating blog:', error);
      loading.dismiss();
      this.presentToast('Failed to update blog', 'danger', 2000);
    }

    console.log(this.html);
  }

  clearEditor() {
    this.html = '';
  }

  previewBlog() {
    // You can implement a preview modal here
    console.log('Preview blog:', this.html);
  }

  openFileDialog() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.presentToast('Please select a valid image file', 'danger', 3000);
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.presentToast('Image size must be less than 5MB', 'danger', 3000);
        return;
      }

      this.selectedImage = file;
      this.imageRemoved = false;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);

      this.presentToast('Image selected successfully', 'success', 2000);
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.imageUrl = '';
    this.imageRemoved = true;
    this.presentToast('Image removed', 'success', 2000);
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
}
