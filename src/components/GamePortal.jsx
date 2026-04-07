import { useState, useEffect, useRef } from 'react';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase.js";
import { doc, onSnapshot } from "firebase/firestore";
import Leaderboard from "./Leaderboard";

const GAME_URL = import.meta.env.VITE_GAME_URL || null;

export default function GamePortal({ user }) {
    
    const iframeRef = useRef(null);
    
    const [userData, setUserData] = useState(null);
    const [gameLoaded, setGameLoaded] = useState(false);
    const [activeTab, setActiveTab]= useState('game');
    
    useEffect(() => {
        const userRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setUserData(snapshot.data());
            }
        });
        
        return () => unsubscribe();
    }, [user.uid]);
    
    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.log("Sign out error", e);
        }
    }
    
    return (
        <>
            <div className="portal-header">
                <button onClick={handleSignOut} className="btn-signout">Sign Out</button>
            </div>
            <div className="game-area">
                <iframe
                    ref={iframeRef}
                    src={GAME_URL}
                    title={"Sponder Bird"}
                    className={`game-frame visible`}
                    allow="fullscreen"
                />
            </div>
            <div className="portal-container">
                <Leaderboard />
            </div>
        </>
    );
}