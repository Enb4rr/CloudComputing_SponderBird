import { useState, useEffect, useRef, useCallback } from 'react';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase.js";
import Leaderboard from "./Leaderboard";
import UserProfile from "./UserProfile.jsx";
import AdminDashboard from "./AdminDashboard.jsx";

// Constants
const GAME_URL = import.meta.env.VITE_GAME_URL || null;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || null;

export default function GamePortal({user, userData}) {
    
    // Variables
    const [gameLoaded, setGameLoaded] = useState(false);
    const [activeTab, setActiveTab]= useState('game');
    
    // Game iFrame
    const iframeRef = useRef(null);
    const retryTimer = useRef(null);
    const authAcknowledged = useRef(null);
    
    // Handle Auth
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
    
    // Track Auth Ack
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
    
    // handle Game Loaded
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
    
    // Handle Auth Sign Out
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

                <div className="tab-bar">
                    <button onClick={() => setActiveTab('userProfile')} className={`tab ${activeTab === 'userProfile' ? 'active' : ''}`}>Profile</button>
                    <button onClick={() => setActiveTab('game')} className={`tab ${activeTab === 'game' ? 'active' : ''}`}>Game</button>
                    {userData?.role === 'admin' && <button onClick={() => setActiveTab('adminDashboard')} className={`tab ${activeTab === 'adminDashboard' ? 'active' : ''}`}>Admin</button>}
                </div>
            </div>

            {activeTab === 'userProfile' && (
                <div className="tab-panel">
                    <p>
                        <UserProfile userData={userData} />
                    </p>
                </div>
            )}

            {activeTab === 'game' && (
                <div className="tab-panel">
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
                </div>
            )}

            {activeTab === 'adminDashboard' && userData?.role === 'admin' && (
                <div className="tab-panel">
                    <p>
                        <AdminDashboard />
                    </p>
                </div>
            )}
        </>
    );
}