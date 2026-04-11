
export default function UserProfile({ userData }) {
    
    // Format joined date
    const joined = userData?.createdAt?.toDate().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    });

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
                        <h2 className="card-title">{userData?.displayName ?? "Player"}</h2>
                        <p className="profile-email">{userData.email}</p>
                        <p className="profile-joined">Joined {joined ?? "Unknown"}</p>
                        <span className={`profile-role ${userData?.role}`}>{userData?.role ?? "player"}</span>
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="leaderboard-card" style={{ textAlign: "center" }}>
                        <span className="stat-label">High Score:  </span>
                        <span className="stat-value">{userData?.highScore ?? 0}</span>
                    </div>
                    <div className="leaderboard-card" style={{ textAlign: "center" }}>
                        <span className="stat-label">Games Played:  </span>
                        <span className="stat-value">{userData?.gamesPlayed ?? 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}