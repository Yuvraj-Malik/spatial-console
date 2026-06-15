import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { getFirestore, doc, collection, addDoc, getDoc, getDocs, query, where, orderBy, deleteDoc } from "firebase/firestore";

// ---- Read Firebase Config from Vite Environment Variables ----
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;
let db;
let googleProvider;
let firebaseEnabled = false;

// Check if credentials are set and are not empty
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "" && !firebaseConfig.apiKey.includes("your_api_key");

if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    firebaseEnabled = true;
    console.log("🔥 Firebase Cloud Services initialized successfully!");
  } catch (error) {
    console.error("⚠️ Firebase initialization failed:", error);
  }
} else {
  console.warn("⚠️ Firebase configuration keys are empty. Running in Sandbox LocalStorage mode.");
}

export { auth, db, googleProvider, firebaseEnabled };

// ---- Fallback Databases Keys ----
const LOCAL_STORAGE_KEY_DESIGNS = "spatial_console_designs";
const LOCAL_STORAGE_KEY_USER = "spatial_console_user";
const LOCAL_STORAGE_KEY_ACCOUNTS = "spatial_console_accounts";

// ---- Authentication Actions ----

// Google Auth Provider Sign-in
export async function loginWithGoogle() {
  if (firebaseEnabled && auth && googleProvider) {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } else {
    // Mock Google Login
    const mockUser = {
      uid: "mock_google_user",
      displayName: "Guest Google Engineer",
      email: "google.guest@spatialconsole.local",
      photoURL: "https://www.gravatar.com/avatar/99999999999999999999999999999999?d=identicon&f=y"
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(mockUser));
    return mockUser;
  }
}

// Email/Password Signup + Username Registration
export async function registerUserWithEmail(email, password, username) {
  if (firebaseEnabled && auth) {
    // Create user in Firebase auth
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Set user's displayName to username
    await updateProfile(credential.user, { displayName: username });
    return credential.user;
  } else {
    // LocalStorage Sandbox Registration
    const accounts = getLocalAccounts();
    const existing = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error("An account with this email already exists locally.");
    }

    const mockUser = {
      uid: "mock_" + Math.random().toString(36).substr(2, 9),
      displayName: username,
      email: email,
      photoURL: null
    };

    // Save credentials in sandbox database
    accounts.push({
      ...mockUser,
      password: password // In mock sandbox we store simple text (not for production)
    });
    localStorage.setItem(LOCAL_STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(mockUser));
    
    return mockUser;
  }
}

// Email/Password Log-in
export async function loginUserWithEmail(email, password) {
  if (firebaseEnabled && auth) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } else {
    // LocalStorage Sandbox Login
    const accounts = getLocalAccounts();
    const match = accounts.find(
      a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );
    
    if (!match) {
      throw new Error("Invalid email or password credentials.");
    }

    const userProfile = {
      uid: match.uid,
      displayName: match.displayName,
      email: match.email,
      photoURL: match.photoURL
    };

    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(userProfile));
    return userProfile;
  }
}

// Sign-out action
export async function logoutUser() {
  if (firebaseEnabled && auth) {
    await signOut(auth);
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
  }
}

// ---- Database Actions (Firestore / Sandbox) ----

// Save a structure design
export async function saveStructure(user, name, cubes, stats) {
  const designData = {
    name,
    cubes,
    stats: {
      totalMass: stats.totalMass,
      totalCost: stats.totalCost,
      maxHeight: stats.maxHeight,
      safetyFactor: stats.safetyFactor === Infinity ? 999 : stats.safetyFactor
    },
    userId: user.uid,
    createdAt: Date.now()
  };

  if (firebaseEnabled && db) {
    const docRef = await addDoc(collection(db, "structures"), designData);
    return docRef.id;
  } else {
    // Save to localStorage
    const saved = getLocalDesigns();
    const id = "local_" + Math.random().toString(36).substr(2, 9);
    saved.push({ id, ...designData });
    localStorage.setItem(LOCAL_STORAGE_KEY_DESIGNS, JSON.stringify(saved));
    return id;
  }
}

// Get list of saved designs for a user
export async function getSavedStructures(userId) {
  if (firebaseEnabled && db) {
    const q = query(
      collection(db, "structures"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    // Sort in memory to avoid index requirement
    list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  } else {
    // Get from localStorage
    return getLocalDesigns()
      .filter(d => d.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

// Load a specific design by ID (for sharing or opening)
export async function loadStructureById(id) {
  if (firebaseEnabled && db) {
    const docRef = doc(db, "structures", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    throw new Error("Structure design not found in cloud database.");
  } else {
    // Get from localStorage
    const found = getLocalDesigns().find(d => d.id === id);
    if (found) return found;
    throw new Error("Structure design not found locally.");
  }
}

// Delete a saved design
export async function deleteStructure(id) {
  if (firebaseEnabled && db) {
    await deleteDoc(doc(db, "structures", id));
  } else {
    const saved = getLocalDesigns().filter(d => d.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_DESIGNS, JSON.stringify(saved));
  }
}

// ---- Local Storage Helper Retrieval Functions ----

function getLocalDesigns() {
  try {
    const items = localStorage.getItem(LOCAL_STORAGE_KEY_DESIGNS);
    return items ? JSON.parse(items) : [];
  } catch (e) {
    return [];
  }
}

function getLocalAccounts() {
  try {
    const items = localStorage.getItem(LOCAL_STORAGE_KEY_ACCOUNTS);
    return items ? JSON.parse(items) : [];
  } catch (e) {
    return [];
  }
}

export function getLocalUser() {
  try {
    const u = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
}
