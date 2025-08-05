import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Editor, Toolbar } from 'ngx-editor';
import { BlogService } from '../services/blog.service';

@Component({
  selector: 'app-blog-editor',
  templateUrl: './blog-editor.page.html',
  styleUrls: ['./blog-editor.page.scss'],
  standalone:false
})
export class BlogEditorPage implements OnInit {

  html = '';
  title = '';
  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic', 'underline', 'strike'], // basic styles
    ['blockquote', 'code',],
    ['ordered_list', 'bullet_list', 'horizontal_rule'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image',], // image & links
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];
  constructor(private loadingController: LoadingController,
              private toastController: ToastController,
              private alertController: AlertController,
              private blogService:BlogService
  ){

  }
  ngOnInit() {
    this.editor = new Editor();

  }

  ionViewWillEnter(){

         
    
  }
  ngOnDestroy(): void {
    this.editor.destroy();
  }


  async presentToast(msg:string, color:string, duration:number) {
    const toast = await this.toastController.create({
      message: msg,
      color:color,
      duration: duration
    });
    toast.present();
  }

  async blogPublishAlertConfirm(msg:string) {
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
          }
        }, {
          text: 'Okay',
          handler: () => {
            console.log('Confirm Okay');
          }
        }
      ]
    });
  
    await alert.present();
  }
  getTitleFromHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const h1 = doc.querySelector('h1');
  return h1?.textContent?.trim() || 'Untitled';
}
  async upload(){
const blog = {
    title: this.getTitleFromHTML(this.html),
    content: this.html
  };

  this.blogService.addBlog(blog).subscribe({
    next: () => this.presentToast('Blog uploaded', 'success', 2000),
    error: () => this.presentToast('Upload failed', 'danger', 2000)
  });

    console.log(this.html);
    
  }
}
