import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { BlogService } from '../services/blog.service';

@Component({
  selector: 'app-blogs',
  templateUrl: './blogs.page.html',
  styleUrls: ['./blogs.page.scss'],
  standalone:false
})
export class BlogsPage implements OnInit {

  blogs:any[] = [];
  constructor(private auth:AuthService,
              private router: Router,
              private blogservice: BlogService,
              private toastController: ToastController,
              private loadingController: LoadingController
  ) { }

  ngOnInit() {
  }


  ionViewDidEnter(){
   this.getAllBlogs();
  }
  onSearchChange(ev:any){
    
  }
    async presentToast(msg:string, color:string, duration:number) {
    const toast = await this.toastController.create({
      message: msg,
      color:color,
      duration: duration
    });
    toast.present();
  }


  async getAllBlogs(){
    let loading = await this.loadingController.create({
      message:"Fetching blogs...",
      duration:2000
    });
    await loading.present();
    this.blogservice.getBlogs()
    .subscribe(
    {
      next:async(value:any) =>{
        console.log(value);
        this.blogs = value['documents'];
        await loading.dismiss();
      },
      error:async (error:any) =>{
      console.log(error);
        await loading.dismiss();
      
      }
    }
    )  ;
  }

  update(item:any){
    console.log(item);
    const documentPath = item.name.split('/documents/')[1]; // Get "blogs/xxx"
    console.log(documentPath);
    this.router.navigate(['update-blog', documentPath]);
    
  
  }

  delete(item:any){
    console.log(item);
 const documentPath = item.name.split('/documents/')[1]; // Get "blogs/xxx"
  this.blogservice.deleteBlog(documentPath).subscribe(() => {
    this.presentToast('Blog deleted!', 'danger', 2000);
    this.getAllBlogs();
  });
  }
  createNewBlog(){
    this.router.navigate(['blog-editor'])
  }
}
