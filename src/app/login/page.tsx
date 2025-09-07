"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "/forecast";
    } else {
      setError(data.error || "Login failed");
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #1d1f21, #2c3e50)",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "#fff",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
          width: "550px",
        }}
      >
        <h2
          style={{
            marginBottom: "1.5rem",
            textAlign: "center",
            color: "#2c3e50",
          }}
        >
          Admin Login
        </h2>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontWeight: "600", color: "#333" }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{
              width: "100%",
              padding: "0.75rem",
              marginTop: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
              outline: "none",
              fontSize: "14px",
              color: "#000000",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem", position: "relative" }}>
          <label style={{ fontWeight: "600", color: "#333" }}>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: "100%",
              padding: "0.75rem",
              marginTop: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
              outline: "none",
              fontSize: "14px",
              color: "#000000",
            }}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(10%)",
              cursor: "pointer",
              fontSize: "14px",
              color: "#555",
              userSelect: "none",
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        {error && (
          <p
            style={{
              color: "red",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "0.85rem",
            background: "#2c3e50",
            color: "#fff",
            fontWeight: "600",
            fontSize: "16px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = "#1abc9c")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = "#2c3e50")
          }
        >
          Login
        </button>
      </form>
    </div>
  );
}
