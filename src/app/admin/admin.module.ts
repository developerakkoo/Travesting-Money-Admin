import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'stock-ideas',
    pathMatch: 'full',
  },
  {
    path: 'stock-ideas',
    loadChildren: () =>
      import('./stock-ideas/stock-ideas.module').then(
        (m) => m.StockIdeasModule
      ),
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [],
})
export class AdminModule {}
