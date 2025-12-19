import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { MutualFundPortfolioPage } from './mutual-fund-portfolio.page';

const routes: Routes = [
  {
    path: '',
    component: MutualFundPortfolioPage,
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
  declarations: [MutualFundPortfolioPage],
  providers: [DecimalPipe],
})
export class MutualFundPortfolioPageModule {}

