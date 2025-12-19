export interface Blog {
  id?: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BlogFormData {
  title: string;
  content: string;
  imageUrl?: string;
}
