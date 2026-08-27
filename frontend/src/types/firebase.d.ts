declare module 'firebase/app' {
  const app: any;
  export function initializeApp(config: any): typeof app;
  export function getApps(): typeof app[];
  export function getApp(): typeof app;
}

declare module 'firebase/auth' {
  export function getAuth(app: any): any;
  export function onAuthStateChanged(auth: any, callback: (user: any) => void): () => void;
  export function signInWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function createUserWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function signOut(auth: any): Promise<void>;
  export function sendPasswordResetEmail(auth: any, email: string): Promise<void>;
  export function updateProfile(user: any, data: any): Promise<void>;
  export function signInWithPopup(auth: any, provider: any): Promise<any>;
  export const GoogleAuthProvider: any;
  export const User: any;
  export type User = any;
  export const AuthError: any;
  export type AuthError = any;
}

declare module 'firebase/firestore' {
  export function getFirestore(app: any): any;
  export const Timestamp: any;
  export type Timestamp = any;
  export const GeoPoint: any;
  export type GeoPoint = any;
  export const DocumentReference: any;
  export const CollectionReference: any;
  export const Query: any;
  export const QueryDocumentSnapshot: any;
  export const doc: any;
  export const setDoc: any;
  export const getDocs: any;
  export const deleteDoc: any;
  export const collection: any;
  export const serverTimestamp: any;
  export const getDoc: any;
  export const updateDoc: any;
  export const query: any;
  export const where: any;
  export const orderBy: any;
  export const limit: any;
  export const onSnapshot: any;
  export const addDoc: any;
  export const collectionGroup: any;
}
