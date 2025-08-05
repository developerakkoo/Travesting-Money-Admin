import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BlogEditorPageRoutingModule } from './blog-editor-routing.module';

import { BlogEditorPage } from './blog-editor.page';
import { NgxEditorComponent, NgxEditorMenuComponent, Editor } from 'ngx-editor';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NgxEditorComponent, 
    NgxEditorMenuComponent,
    BlogEditorPageRoutingModule
  ],
  declarations: [BlogEditorPage],
  schemas:[CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class BlogEditorPageModule {}
