import { FIREBASE_CONFIG, DEFAULT_SITE_CONFIG } from '../app/constants';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  writeBatch,
  query,
  where
} from 'firebase/firestore';

let app;
let db;

const getDb = () => {
  if (db) return db;
  try {
    app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    return db;
  } catch (error) {
    console.error("CRITICAL: Failed to initialize Firebase:", error);
    throw error;
  }
};

const PROJECTS_COLLECTION = 'projects';
const SETTINGS_COLLECTION = 'settings';
const USERS_COLLECTION = 'users';

export const dataService = {
  getAllUsers: async () => {
    try {
      const database = getDb();
      const snapshot = await getDocs(collection(database, USERS_COLLECTION));
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  checkUserExists: async (userId) => {
    try {
      const database = getDb();
      const docRef = doc(database, USERS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      return false;
    }
  },

  registerUser: async (user) => {
    try {
      const database = getDb();
      await setDoc(doc(database, USERS_COLLECTION, user.id), user);
      const initialConfig = { ...DEFAULT_SITE_CONFIG, websiteTitle: `${user.username}'s Portfolio` };
      await setDoc(doc(database, SETTINGS_COLLECTION, user.id), initialConfig);
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  },

  verifyUser: async (userId, password) => {
    try {
      const database = getDb();
      const docRef = doc(database, USERS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.password === password) {
          return userData;
        }
      }
      return null;
    } catch (error) {
      console.error("Error verifying user:", error);
      throw error;
    }
  },

  getProjects: async (ownerId) => {
    try {
      const database = getDb();
      const q = query(collection(database, PROJECTS_COLLECTION), where("ownerId", "==", ownerId));
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return projects.sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return b.createdAt - a.createdAt;
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  },

  getProjectById: async (id) => {
    try {
      const database = getDb();
      const docRef = doc(database, PROJECTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching project:", error);
      throw error;
    }
  },

  addProject: async (project) => {
    try {
      const database = getDb();
      const newProjectData = {
        ...project,
        createdAt: Date.now(),
        order: Date.now()
      };
      const docRef = await addDoc(collection(database, PROJECTS_COLLECTION), newProjectData);
      return { id: docRef.id, ...newProjectData };
    } catch (error) {
      console.error("Error adding project:", error);
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const database = getDb();
      const docRef = doc(database, PROJECTS_COLLECTION, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      const database = getDb();
      await deleteDoc(doc(database, PROJECTS_COLLECTION, id));
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  },

  saveProjectOrder: async (projects) => {
    try {
      const database = getDb();
      const batch = writeBatch(database);
      projects.forEach((project, index) => {
        const docRef = doc(database, PROJECTS_COLLECTION, project.id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error saving order:", error);
      throw error;
    }
  },

  getSiteConfig: async (userId) => {
    try {
      const database = getDb();
      const docRef = doc(database, SETTINGS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return DEFAULT_SITE_CONFIG;
    } catch (error) {
      console.error("Error fetching site config:", error);
      return DEFAULT_SITE_CONFIG;
    }
  },

  saveSiteConfig: async (userId, config) => {
    try {
      const database = getDb();
      const docRef = doc(database, SETTINGS_COLLECTION, userId);
      await setDoc(docRef, config);
    } catch (error) {
      console.error("Error saving site config:", error);
      throw error;
    }
  }
};