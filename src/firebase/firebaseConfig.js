// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9S1I2-Dy8JYT1TbhRj8fSL3401qbFzvw",
  authDomain: "pdfdraw-30ab9.firebaseapp.com",
  projectId: "pdfdraw-30ab9",
  storageBucket: "pdfdraw-30ab9.appspot.com",
  messagingSenderId: "988684647843",
  appId: "1:988684647843:web:384ff00a0720e1627fee16",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
const storage = getStorage(app);

export { storage };
