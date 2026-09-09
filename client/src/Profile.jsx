function Profile({
  onBackToDashboard,
  onLogout,
}) {
  const user =
    JSON.parse(localStorage.getItem("user")) || {};

  const initials = (user.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="profile-page">

      <div className="profile-container">

        {/* BACK TO DASHBOARD */}

        <button
          className="secondary-btn"
          onClick={onBackToDashboard}
        >
          ← Back to Dashboard
        </button>


        {/* PROFILE CARD */}

        <div className="profile-card">

          {/* AVATAR */}

          <div className="profile-avatar">
            {initials}
          </div>


          {/* HEADING */}

          <p className="profile-eyebrow">
            MY PROFILE
          </p>

          <h1>
            {user.name || "User"}
          </h1>

          <p className="profile-subtitle">
            Manage your account information
          </p>


          {/* PROFILE INFORMATION */}

          <div className="profile-info-grid">

            <div className="profile-info-item">

              <span>
                Full Name
              </span>

              <strong>
                {user.name || "Not available"}
              </strong>

            </div>


            <div className="profile-info-item">

              <span>
                Email Address
              </span>

              <strong>
                {user.email || "Not available"}
              </strong>

            </div>


            <div className="profile-info-item">

              <span>
                Account Status
              </span>

              <strong className="profile-status">
                ● Active
              </strong>

            </div>


            <div className="profile-info-item">

              <span>
                Platform
              </span>

              <strong>
                AI Interview Arena
              </strong>

            </div>

          </div>


          {/* ACTION BUTTONS */}

          <div className="profile-actions">

            <button
              className="secondary-btn"
              onClick={onBackToDashboard}
            >
              Dashboard
            </button>


            <button
              className="logout-btn"
              onClick={onLogout}
            >
              Logout
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Profile;