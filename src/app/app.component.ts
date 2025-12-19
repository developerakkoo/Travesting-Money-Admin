import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  public appPages = [
    { title: 'Dashboard', url: '/folder/dashboard', icon: 'analytics' },
    { title: 'Blogs', url: '/blogs', icon: 'document' },
    { title: 'Subscriptions', url: '/folder/favorites', icon: 'card' },
    // { title: 'Courses', url: '/folder/archived', icon: 'people' },
    { title: 'Portfolio', url: '/portfolio', icon: 'pie-chart' },
    { title: 'Mutual Fund Portfolio', url: '/mutual-fund-portfolio', icon: 'pie-chart' },
    { title: 'Contacts', url: '/contacts', icon: 'people' },
  ];
  constructor() {}
}
