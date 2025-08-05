import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UpdateBlogPageRoutingModule } from './update-blog-routing.module';

import { UpdateBlogPage } from './update-blog.page';
import { NgxEditorComponent, NgxEditorMenuComponent } from 'ngx-editor';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
      NgxEditorComponent, 
        NgxEditorMenuComponent,
    UpdateBlogPageRoutingModule
  ],
  declarations: [UpdateBlogPage],
    schemas:[CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class UpdateBlogPageModule {}
