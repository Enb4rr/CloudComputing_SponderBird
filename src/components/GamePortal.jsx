import { useState, useEffect, useRef, useCallback } from 'react';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase.js";
import { doc, onSnapshot } from "firebase/firestore";
import Leaderboard from "./Leaderboard";

const GAME_URL = import.meta.env.VITE_GAME_URL || null;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || null;

export default function GamePortal({ user }) {
    
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
    
    const iframeRef = useRef(null);
    const retryTimer = useRef(null);
    const authAcknowledged = useRef(null);
    
    const sendAuthToGame = useCallback(async () => {
        if (!iframeRef.current?.contentWindow || !user || authAcknowledged.current) return;
        
        try {
            const idToken = await user.getIdToken();
            const payload = {
                type: "firebase-auth",
                uid: user.uid,
                displayName: user.displayName || user.email || "Player",
                idToken,
                projectId: FIREBASE_PROJECT_ID,
            };
            
            iframeRef.current.contentWindow.postMessage(payload, "*");
            console.log("Auth token sent to iframe... waiting for ack");
            
        } catch (err) {
            console.error("Failed to send auth... " , err);
        }
    });
    
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.type === "firebase-auth-ack") {
                console.log("Game acknowledged successfully.");
                authAcknowledged.current = true;
                if (retryTimer.current) {
                    clearTimeout(retryTimer.current);   
                    retryTimer.current = null;
                }
            }
        }
        
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);
    
    const handleGameLoaded = useCallback(() => {
       setGameLoaded(true); 
       authAcknowledged.current = false;
       sendAuthToGame();
       
       retryTimer.current = setInterval(sendAuthToGame, 2000);
       
       setTimeout(() => {
           if (retryTimer.current) {
               clearInterval(retryTimer.current);
               retryTimer.current = null;
               if (!authAcknowledged.current) {
                   console.warn("Game never acknowledged successfully.");
               }
           }
       }, 30000);
    }, [sendAuthToGame]);
    
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
                    className={`game-frame ${gameLoaded ? "visible" : "hidden"}`}
                    allow="fullscreen"
                    onLoad={handleGameLoaded}
                />
            </div>
            <div className="portal-container">
                <Leaderboard />
            </div>
        </>
    );
}