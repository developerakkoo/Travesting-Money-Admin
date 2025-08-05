import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogEditorPage } from './blog-editor.page';

describe('BlogEditorPage', () => {
  let component: BlogEditorPage;
  let fixture: ComponentFixture<BlogEditorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogEditorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
