import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function clearCollections() {
  console.log("Starting full reset of the product data environment...");

  // Load config
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("firebase-applet-config.json not found!");
    process.exit(1);
  }

  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

  const collectionsToClear = ["products", "reviews"];

  for (const collectionName of collectionsToClear) {
    try {
      console.log(`Fetching documents from '${collectionName}' collection...`);
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      
      console.log(`Found ${snapshot.size} documents in '${collectionName}'. Deleting...`);
      
      const deletePromises = snapshot.docs.map((docSnap) => {
        console.log(`Deleting ${collectionName}/${docSnap.id}`);
        return deleteDoc(doc(db, collectionName, docSnap.id));
      });

      await Promise.all(deletePromises);
      console.log(`Successfully cleared '${collectionName}' collection!`);
    } catch (error) {
      console.error(`Error clearing collection '${collectionName}':`, error);
    }
  }

  console.log("Full Firestore reset complete!");
}

clearCollections().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
