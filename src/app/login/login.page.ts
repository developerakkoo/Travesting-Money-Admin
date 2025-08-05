import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, MenuController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone:false
})
export class LoginPage implements OnInit {

  loginForm!:FormGroup;
  constructor(private formBuilder: FormBuilder,
              private loadingController: LoadingController,
              private toastController: ToastController,
              private menuController: MenuController,
              private router:Router,
              private auth:AuthService
  ) { 

    this.menuController.enable(false);
    this.loginForm = this.formBuilder.group({
      email:['',[Validators.required, Validators.email]],
      password:['',[Validators.required, Validators.min(6)]]
    })

  }

  ngOnInit() {
  }

  ionViewDidEnter(){
   
  }

  async presentToast(msg:string, color:string) {
    const toast = await this.toastController.create({
      message: msg,
      color:color,
      duration: 2000
    });
    toast.present();
  }


  ionViewDidLeave(){
   
  }


  async onSubmit(){
    if(this.loginForm.valid){
      console.log(this.loginForm.value);
      try{
        const user = await this.auth.login(this.loginForm.value.email, this.loginForm.value.password);
        this.presentToast("Logged In to Admin!", "success");
        this.router.navigate(['dash']);
      }catch(err:any){
        this.presentToast(err.message, "danger");
      }
      
    }
  }


}
