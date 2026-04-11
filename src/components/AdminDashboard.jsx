import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function AdminDashboard() {
    
    // Variables
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalUsers: 0, totalGamesPlayed: 0, highestScore: 0 });

    // Fetch users at load
    useEffect(() => {
        fetchUsers();
    }, []);

    // Handle users fetch
    const fetchUsers = async () => {
        try {
            const snapshot = await getDocs(collection(db, "users"));
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setUsers(data);
            setStats({
                totalUsers: data.length,
                totalGamesPlayed: data.reduce((sum, u) => sum + (u.gamesPlayed ?? 0), 0),
                highestScore: Math.max(...data.map(u => u.highScore ?? 0))
            });
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    // Handle role update locally and in Firestore
    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === "admin" ? "player" : "admin";
        try {
            await updateDoc(doc(db, "users", userId), { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error("Failed to update role", err);
        }
    };

    if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

    return (
        <div className="tab-panel">
            <h2 className="card-title" style={{ marginBottom: "1rem" }}>Admin Dashboard</h2>

            <div className="profile-stats" style={{ marginBottom: "1rem" }}>
                <div className="leaderboard-card" style={{ textAlign: "center" }}>
                    <span className="stat-label">Total Users:  </span>
                    <span className="stat-value">{stats.totalUsers}</span>
                </div>
                <div className="leaderboard-card" style={{ textAlign: "center" }}>
                    <span className="stat-label">Games Played:  </span>
                    <span className="stat-value">{stats.totalGamesPlayed}</span>
                </div>
                <div className="leaderboard-card" style={{ textAlign: "center" }}>
                    <span className="stat-label">Highest Score:  </span>
                    <span className="stat-value">{stats.highestScore}</span>
                </div>
            </div>

            <div className="leaderboard-card">
                <div className="card-header">
                    <h3 className="card-title">All Users</h3>
                    <div className="card-badge">{stats.totalUsers} total</div>
                </div>
                <table className="admin-table">
                    <thead>
                    <tr>
                        <th>Player</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>High Score</th>
                        <th>Games Played</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.displayName ?? "Anonymous"}</td>
                            <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                            <td>
                                <span className={`profile-role ${u.role}`}>{u.role ?? "player"}</span>
                            </td>
                            <td style={{ color: "var(--success)", fontWeight: 700 }}>{u.highScore ?? 0}</td>
                            <td style={{ color: "var(--text-secondary)" }}>{u.gamesPlayed ?? 0}</td>
                            <td>
                                <button
                                    className="btn-role-toggle"
                                    onClick={() => toggleRole(u.id, u.role)}
                                >
                                    {u.role === "admin" ? "Make Player" : "Make Admin"}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}