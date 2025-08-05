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
    { title: 'Courses', url: '/folder/archived', icon: 'people' },
  ];
  constructor() {}
}
