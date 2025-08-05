import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateBlogPage } from './update-blog.page';

describe('UpdateBlogPage', () => {
  let component: UpdateBlogPage;
  let fixture: ComponentFixture<UpdateBlogPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateBlogPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
