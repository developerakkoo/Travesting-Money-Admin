import { Component, OnInit } from '@angular/core';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { Editor, Toolbar } from 'ngx-editor';
import { BlogService } from '../services/blog.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-update-blog',
  templateUrl: './update-blog.page.html',
  styleUrls: ['./update-blog.page.scss'],
  standalone:false
})
export class UpdateBlogPage implements OnInit {

  documentId:any;
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
              private router:Router,
              private route:ActivatedRoute,
              private alertController: AlertController,
              private blogService:BlogService
  ){
this.documentId = this.route.snapshot.paramMap.get("id");
console.log(this.documentId);

  }
  ngOnInit() {
    this.editor = new Editor();

  }

  ionViewWillEnter(){

         this.getBlogById(this.documentId);
    
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
      createdAt: res.fields.createdAt || res.fields.updatedAt,
    };
    console.log('Blog:', blog);
    this.html = blog.content;
    this.title = blog.title;
    // You can display in editor or detail page
  });
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
  
  async upload(){
      const blogId = this.documentId.split('/')[1]; 
const blog = {
    title:  this.getTitleFromHTML(this.html),
    content: this.html
  };

  this.blogService.updateBlog(this.documentId,blog).subscribe({
    next: () => {this.presentToast('Blog updated', 'success', 2000)
      this.router.navigate(['blogs']);
    },
    error: () => this.presentToast('Upload failed', 'danger', 2000)
  });

    console.log(this.html);
    
  }
}
