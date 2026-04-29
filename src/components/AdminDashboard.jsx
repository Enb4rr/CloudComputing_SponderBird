import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import SCORES_PLOT from "../plots/scores_plot.py?raw";
import SESSIONS_PLOT from "../plots/sessions_plot.py?raw";

let pyodideReady = null;

function getPyodide() {
    if (!pyodideReady) {
        pyodideReady = (async () => {
            const pyodide = await globalThis.loadPyodide();
            await pyodide.loadPackage(["matplotlib"]);
            return pyodide;
        })();
    }
    return pyodideReady;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalUsers: 0, totalGamesPlayed: 0, highestScore: 0 });
    const [chartStatus, setChartStatus] = useState("Loading charts...");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch users
            const usersSnapshot = await getDocs(collection(db, "users"));
            const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch sessions from scores collection
            const sessionsSnapshot = await getDocs(collection(db, "scores"));
            const sessionsData = sessionsSnapshot.docs.map(doc => doc.data());

            setUsers(usersData);
            setStats({
                totalUsers: usersData.length,
                totalGamesPlayed: sessionsData.length,
                highestScore: Math.max(...usersData.map(u => u.highScore ?? 0))
            });

            setLoading(false);
            runCharts(usersData, sessionsData);
        } catch (err) {
            console.error("Failed to fetch data", err);
            setLoading(false);
        }
    };

    const runCharts = async (usersData, sessionsData) => {
        try {
            setChartStatus("Loading Pyodide...");
            const pyodide = await getPyodide();

            // Scores chart data
            const scoresData = usersData
                .filter(u => u.highScore > 0)
                .sort((a, b) => b.highScore - a.highScore)
                .slice(0, 10)
                .map(u => ({ name: u.displayName ?? "Player", score: u.highScore ?? 0 }));

            window.__pyodideData = JSON.stringify(scoresData);
            setChartStatus("Rendering scores chart...");
            await pyodide.runPythonAsync(SCORES_PLOT);

            // Sessions over time chart data
            const sessionsByDay = sessionsData.map(s => {
                const date = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
                return { day: date.toISOString().split("T")[0] };
            });

            window.__pyodideData = JSON.stringify(sessionsByDay);
            setChartStatus("Rendering sessions chart...");
            await pyodide.runPythonAsync(SESSIONS_PLOT);

            setChartStatus("Done");
        } catch (err) {
            console.error("Chart error", err);
            setChartStatus("Error rendering charts, check console");
        }
    };

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

            {/* Summary Stats */}
            <div className="profile-stats" style={{ marginBottom: "1rem" }}>
                <div className="leaderboard-card" style={{ textAlign: "center" }}>
                    <span className="stat-value">{stats.totalUsers}</span>
                    <span className="stat-label">Total Users</span>
                </div>
                <div className="leaderboard-card" style={{ textAlign: "center" }}>
                    <span className="stat-value">{stats.totalGamesPlayed}</span>
                    <span className="stat-label">Games Played</span>
                </div>
                <div className="leaderboard-card" style={{ textAlign: "center" }}>
                    <span className="stat-value">{stats.highestScore}</span>
                    <span className="stat-label">Highest Score</span>
                </div>
            </div>

            {/* Charts */}
            <div className="leaderboard-card" style={{ marginBottom: "1rem" }}>
                <div className="card-header">
                    <h3 className="card-title">Charts</h3>
                    <span className="card-badge">{chartStatus}</span>
                </div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    <div style={{ flex: 1, minWidth: "280px" }}>
                        <div id="scores-chart"><p style={{ color: "var(--text-secondary)" }}>Loading scores chart...</p></div>
                    </div>
                    <div style={{ flex: 1, minWidth: "280px" }}>
                        <div id="sessions-chart"><p style={{ color: "var(--text-secondary)" }}>Loading sessions chart...</p></div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
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
                            <td><span className={`profile-role ${u.role}`}>{u.role ?? "player"}</span></td>
                            <td style={{ color: "var(--success)", fontWeight: 700 }}>{u.highScore ?? 0}</td>
                            <td style={{ color: "var(--text-secondary)" }}>{u.gamesPlayed ?? 0}</td>
                            <td>
                                <button className="btn-role-toggle" onClick={() => toggleRole(u.id, u.role)}>
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