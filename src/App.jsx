import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth"
import {doc, getDoc, setDoc, serverTimestamp, onSnapshot} from "firebase/firestore";
import { auth, db } from "./firebase";
import LoginForm from "./components/LoginForm.jsx";
import GamePortal from "./components/GamePortal.jsx";

// Handle User Profile creation
async function createUserProfileIfNeeded(firebaseUser) {
    
    // Get Users db
    const userRef = doc(db, "users", firebaseUser.uid);
    const snapshot = await getDoc(userRef);
    
    // Check if does not user exists
    if (!snapshot.exists()) {
        
        await setDoc(userRef, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "Player",
            photoURL: firebaseUser.photoURL || null,
            createdAt: serverTimestamp(),
            highScore: 0,
            gamesPlayed: 0,
            role: "player" // Default every new user as Player
        });
        
        console.log(`User ${firebaseUser.email} created`);
    }
}

export default function App() {

    // Variables
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Handle Auth and userData at load
    useEffect(() => {
       
        // Unsubscribe Variable to Firestore Data
        let unsubscribeFirestore = null;
        
        // Track Auth State
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                await createUserProfileIfNeeded(firebaseUser);
                setUser(firebaseUser);

                // Get Snapshot of userData
                const userRef = doc(db, "users", firebaseUser.uid);
                unsubscribeFirestore = onSnapshot(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setUserData(snapshot.data());
                    }
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        // Clean subscriptions
        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) unsubscribeFirestore();
        }
        
    }, []);

    if (loading) {
        return (
            <div>
                <p>Checking auth state...</p>
            </div>
        )
    }

    return (
        <div className="app">
            {user ? <GamePortal user={user} userData={userData} /> : <LoginForm />}
        </div>
    )
}