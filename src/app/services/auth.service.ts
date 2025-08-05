import { Injectable } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = getAuth();
  public currentUser: User | null = null;

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
    });
  }

  async register(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    await signOut(this.auth);
  }

  getCurrentUser() {
    return this.currentUser;
  }
}
