declare module 'firebase/app' {
  export function initializeApp(config: any): any;
  export function getApps(): any[];
  export function getApp(): any;
}

declare module 'firebase/auth' {
  export function getAuth(app: any): any;
}

declare module 'firebase/firestore' {
  export function getFirestore(app: any): any;
  export const Timestamp: any;
  export const GeoPoint: any;
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
}
