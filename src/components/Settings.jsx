import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Settings.css";

const Settings = () => {
  const [userEmail, setUserEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false); // Add state for dark mode
  const [preferences, setPreferences] = useState([
    { id: 1, text: "Darkmode", checked: false },
    { id: 2, text: "Receive Notifications", checked: false },
    { id: 3, text: "Sound on notifications", checked: true },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedUsername = localStorage.getItem('userName');
    const storedDarkMode = localStorage.getItem('isDarkMode') === 'true';

    if (storedEmail) {
      setUserEmail(storedEmail);
    }
    if (storedUsername) {
      setUsername(storedUsername);
    }
    setIsDarkMode(storedDarkMode); // Load dark mode preference
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === 1 ? { ...pref, checked: storedDarkMode } : pref
      )
    );
  }, []);

  const handlePreferenceChange = (id) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, checked: !pref.checked } : pref
      )
    );

    if (id === 1) {
      setIsDarkMode(!isDarkMode);
      localStorage.setItem('isDarkMode', !isDarkMode); // Save dark mode preference
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/account/delete-account`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            localStorage.removeItem("token");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("username");
            navigate("/signup");
        } else {
            const error = await response.json();
            alert(`Failed to delete account: ${error.message}`);
        }
    } catch (err) {
        console.error("Error deleting account:", err);
        alert("An error occurred while deleting the account.");
    }
  };

  const userDetails = [
    { label: "Email", value: userEmail },
    { label: "Username", value: username },
  ];

  return (
    <div className={`settings-container ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Back Arrow */}
      <div className="back-arrow-container" onClick={() => navigate("/chat")}>
        <span className="back-arrow">←</span>
      </div>

      {/* Profile Section */}
      <div className="profile-section">
        <img
          className="profile-picture"
          src="https://via.placeholder.com/150"
          alt="User"
        />
        {userDetails.map((detail, index) => (
          <p key={index} className="profile-name">
            {detail.label}: {detail.value} 
          </p>
        ))}

        <div>

        </div>
        
        <button className="apply-button">Apply</button>
        <button className="delete-account-button" onClick={handleDeleteAccount}>Delete Account</button>
      </div>

      {/* General Section */}
      <div className="general-section">
        <h2 className="section-title">General</h2>
        {preferences.map((pref) => (
          <div key={pref.id} className="preference-item">
            <input
              type="checkbox"
              checked={pref.checked}
              onChange={() => handlePreferenceChange(pref.id)}
            />
            <span
              className={`preference-text ${
                pref.checked ? "text-checked" : "text-unchecked"
              }`}
            >
              {pref.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
