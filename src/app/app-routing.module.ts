import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'dash',
    redirectTo: 'folder/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'folder/:id',
    loadChildren: () => import('./folder/folder.module').then( m => m.FolderPageModule)
  },
  {
    path: 'blog-editor',
    loadChildren: () => import('./blog-editor/blog-editor.module').then( m => m.BlogEditorPageModule)
  },
  {
    path: '',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'blogs',
    loadChildren: () => import('./blogs/blogs.module').then( m => m.BlogsPageModule)
  },
  {
    path: 'update-blog/:id',
    loadChildren: () => import('./update-blog/update-blog.module').then( m => m.UpdateBlogPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
