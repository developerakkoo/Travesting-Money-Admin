import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BlogEditorPage } from './blog-editor.page';

const routes: Routes = [
  {
    path: '',
    component: BlogEditorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BlogEditorPageRoutingModule {}
