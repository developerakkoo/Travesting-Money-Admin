import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { StockIdeaEditorPage } from './stock-idea-editor.page';
import { PopoverInfoComponent } from './popover-info.component';
import { RecentTradeUpdatesPipe } from './recent-trade-updates.pipe';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'new',
    pathMatch: 'full',
  },
  {
    path: ':id',
    component: StockIdeaEditorPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    StockIdeaEditorPage,
    PopoverInfoComponent,
    RecentTradeUpdatesPipe,
  ],
})
export class StockIdeasModule {}
