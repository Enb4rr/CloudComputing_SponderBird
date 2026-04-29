import { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import Leaderboard from "./Leaderboard";

export default function UserProfile({ user, userData }) {
    const [editing, setEditing] = useState(false);
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);

    const joined = userData?.createdAt?.toDate().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    });

    const handleSave = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), { displayName: newName.trim() });
            setEditing(false);
        } catch (err) {
            console.error("Failed to update name", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="tab-panel">
            <div className="profile-card leaderboard-card">
                <div className="profile-header">
                    {userData?.photoURL
                        ? <img src={userData.photoURL} alt="avatar" className="profile-avatar" />
                        : <div className="avatar-placeholder">
                            {userData?.displayName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                    }
                    <div>
                        {editing ? (
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                                <input
                                    className="edit-name-input"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder={userData?.displayName}
                                    autoFocus
                                />
                                <button className="btn-role-toggle promote" onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving..." : "Save"}
                                </button>
                                <button className="btn-role-toggle" onClick={() => setEditing(false)}>
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                                <h2 className="card-title">{userData?.displayName ?? "Player"}</h2>
                                <button className="btn-role-toggle" onClick={() => {
                                    setNewName(userData?.displayName ?? "");
                                    setEditing(true);
                                }}>
                                    Edit
                                </button>
                            </div>
                        )}
                        <p className="profile-email">{user.email}</p>
                        <p className="profile-joined">Joined {joined ?? "Unknown"}</p>
                        <span className={`profile-role ${userData?.role}`}>{userData?.role ?? "player"}</span>
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="leaderboard-card" style={{ textAlign: "center" }}>
                        <span className="stat-value">{userData?.highScore ?? 0}</span>
                        <span className="stat-label">High Score</span>
                    </div>
                    <div className="leaderboard-card" style={{ textAlign: "center" }}>
                        <span className="stat-value">{userData?.gamesPlayed ?? 0}</span>
                        <span className="stat-label">Games Played</span>
                    </div>
                </div>
            </div>
        </div>
    );
}