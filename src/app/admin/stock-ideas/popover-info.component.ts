import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController } from '@ionic/angular';

export interface PopoverInfoData {
  title: string;
  content: string | string[];
  icon?: string;
}

@Component({
  selector: 'app-popover-info',
  templateUrl: './popover-info.component.html',
  styleUrls: ['./popover-info.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class PopoverInfoComponent implements OnInit {
  @Input() data!: PopoverInfoData;

  constructor(private popoverController: PopoverController) {}

  ngOnInit() {}

  dismiss() {
    this.popoverController.dismiss();
  }

  get contentArray(): string[] {
    if (Array.isArray(this.data.content)) {
      return this.data.content;
    }
    return [this.data.content];
  }
}
