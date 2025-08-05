import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UpdateBlogPage } from './update-blog.page';

const routes: Routes = [
  {
    path: '',
    component: UpdateBlogPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UpdateBlogPageRoutingModule {}
