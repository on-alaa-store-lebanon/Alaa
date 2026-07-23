import React, { useState } from "react";
import { Lock, X, Eye, EyeOff, ShieldAlert, UserPlus, User as UserIcon, Mail, ShieldCheck } from "lucide-react";
import { User, loadUsers, saveUsers, hashPassword, UserRole, ROLE_LABELS } from "../lib/auth";
import { sanitizeInput, addSecurityLog } from "../lib/security";

interface PasswordModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");

  // Login States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register States
  const [regUsername, setRegUsername] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("dispatcher");
  const [activationCode, setActivationCode] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Sanitize user inputs to prevent XSS and injection
    const cleanUsername = sanitizeInput(username);
    const cleanPassword = sanitizeInput(password);

    if (!cleanUsername || !cleanPassword) {
      setError("Please fill in all fields with valid characters.");
      addSecurityLog("FAILED_LOGIN", username, "Empty credentials or blocked input characters");
      return;
    }

    const users = loadUsers();
    const foundUser = users.find(
      (u) => 
        u.username.toLowerCase() === cleanUsername.toLowerCase() ||
        u.email.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (!foundUser) {
      setError("User account not found.");
      addSecurityLog("FAILED_LOGIN", cleanUsername, "User account not found in database");
      return;
    }

    const inputHash = hashPassword(cleanPassword);
    if (foundUser.passwordHash === inputHash) {
      addSecurityLog("LOGIN_SUCCESS", foundUser.username, "Authenticated via terminal login portal");
      onSuccess(foundUser);
    } else {
      setError("Incorrect password. Access denied.");
      addSecurityLog("FAILED_LOGIN", cleanUsername, "Incorrect password. Authentication rejected");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanUsername = sanitizeInput(regUsername).trim().toLowerCase();
    const cleanFullName = sanitizeInput(regFullName).trim();
    const cleanEmail = sanitizeInput(regEmail).trim();
    const cleanPassword = sanitizeInput(regPassword).trim();
    const cleanCode = sanitizeInput(activationCode).trim();

    if (!cleanUsername || !cleanFullName || !cleanEmail || !cleanPassword || !cleanCode) {
      setError("Please fill in all registration fields.");
      return;
    }

    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (cleanPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate Staff Activation Code to secure registration from public abuse
    if (cleanCode !== "ALAA2026" && cleanCode !== "A123321A") {
      setError("Invalid Staff Activation Code. Access restricted.");
      addSecurityLog("UNAUTHORIZED_ACCESS", cleanUsername, `Attempted registration with invalid activation code: ${cleanCode}`);
      return;
    }

    const users = loadUsers();
    const exists = users.some((u) => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      setError("Username is already taken by another staff member.");
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      fullName: cleanFullName,
      email: cleanEmail,
      role: regRole,
      passwordHash: hashPassword(cleanPassword)
    };

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);

    addSecurityLog("SIGNUP_SUCCESS", cleanUsername, `Registered staff account: ${cleanFullName} (${ROLE_LABELS[regRole]})`);
    onSuccess(newUser);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
      <div 
        id="password-dialog"
        className="bg-[#0F172A] text-white w-full max-w-sm rounded-[32px] border-2 border-slate-800 p-6 relative shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button 
          id="close-password-modal"
          onClick={onClose} 
          className="absolute right-5 top-5 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={18} strokeWidth={3} />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="w-12 h-12 bg-white/5 text-white rounded-2xl flex items-center justify-center border-2 border-white/10 shadow-sm">
            {mode === "login" ? <Lock size={20} strokeWidth={2.5} /> : <UserPlus size={20} strokeWidth={2.5} />}
          </div>
          <h3 className="text-base font-black tracking-widest uppercase text-white">
            {mode === "login" ? "Secure Terminal Login" : "Staff Registration"}
          </h3>
          <p className="text-[9px] text-slate-400 max-w-[260px] font-bold uppercase tracking-wider leading-relaxed">
            {mode === "login" 
              ? "Enter your credentials to access the RBAC Management Desk."
              : "Register a secure administrator or dispatch team credential."}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 pb-1.5 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase tracking-widest border-b-2 transition ${
              mode === "login"
                ? "border-white text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Terminal Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase tracking-widest border-b-2 transition ${
              mode === "register"
                ? "border-white text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Register Staff
          </button>
        </div>

        {/* LOGIN MODE */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-1">
            {/* Username Input */}
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Username
              </label>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="ENTER USERNAME"
                autoFocus
                className="w-full bg-[#1E293B] border-2 border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500/80 focus:outline-none focus:border-white transition font-black uppercase tracking-widest"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="ENTER PASSWORD"
                  className="w-full bg-[#1E293B] border-2 border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500/80 focus:outline-none focus:border-white pr-12 transition font-black uppercase tracking-widest"
                />
                <button
                  id="toggle-password-visibility"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={15} strokeWidth={2.5} /> : <Eye size={15} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-950/40 border-2 border-red-900 text-red-400 text-[10px] px-3.5 py-3 rounded-2xl font-black uppercase tracking-wider animate-shake">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1.5">
              <button
                id="cancel-password"
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-3 px-4 rounded-2xl text-[10px] uppercase tracking-widest transition border border-slate-700 active:scale-95 shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="submit-password"
                type="submit"
                className="flex-1 bg-white hover:bg-slate-100 text-[#0F172A] font-black py-3 px-4 rounded-2xl text-[10px] uppercase tracking-widest transition active:scale-95 shadow-md cursor-pointer"
              >
                Verify
              </button>
            </div>
          </form>
        )}

        {/* REGISTER MODE */}
        {mode === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
            {/* Username Input */}
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Username
              </label>
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => {
                  setRegUsername(e.target.value);
                  setError("");
                }}
                placeholder="e.g. jamil99"
                className="w-full bg-[#1E293B] border-2 border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-500/80 focus:outline-none focus:border-white transition font-black uppercase tracking-widest"
              />
            </div>

            {/* Full Name Input */}
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => {
                  setRegFullName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Jamil Kadi"
                className="w-full bg-[#1E293B] border-2 border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-500/80 focus:outline-none focus:border-white transition font-black uppercase tracking-widest"
              />
            </div>

            {/* Email Address Input */}
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  setError("");
                }}
                placeholder="e.g. jamil@alaa.store"
                className="w-full bg-[#1E293B] border-2 border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-500/80 focus:outline-none focus:border-white transition font-black uppercase tracking-widest"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={regShowPassword ? "text" : "password"}
                  required
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="CREATE PASSWORD"
                  className="w-full bg-[#1E293B] border-2 border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-500/80 focus:outline-none focus:border-white pr-12 transition font-black uppercase tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setRegShowPassword(!regShowPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {regShowPassword ? <EyeOff size={15} strokeWidth={2.5} /> : <Eye size={15} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Assigned Role
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full bg-[#1E293B] border-2 border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-white transition font-black uppercase tracking-widest"
              >
                <option value="dispatcher" className="bg-[#0F172A]">Order Dispatcher</option>
                <option value="manager" className="bg-[#0F172A]">Store Manager</option>
                <option value="super_admin" className="bg-[#0F172A]">Super Admin</option>
              </select>
            </div>

            {/* Staff Activation Code */}
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 flex justify-between">
                <span>Staff Activation Code</span>
                <span className="text-yellow-400/80 font-bold lowercase">Code: ALAA2026</span>
              </label>
              <input
                type="password"
                required
                value={activationCode}
                onChange={(e) => {
                  setActivationCode(e.target.value);
                  setError("");
                }}
                placeholder="ENTER SECURE ACTIVATION CODE"
                className="w-full bg-[#1E293B] border-2 border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-500/80 focus:outline-none focus:border-white transition font-black uppercase tracking-widest"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-950/40 border-2 border-red-900 text-red-400 text-[10px] px-3.5 py-3 rounded-2xl font-black uppercase tracking-wider animate-shake">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-3 px-4 rounded-2xl text-[10px] uppercase tracking-widest transition border border-slate-700 active:scale-95 shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-white hover:bg-slate-100 text-[#0F172A] font-black py-3 px-4 rounded-2xl text-[10px] uppercase tracking-widest transition active:scale-95 shadow-md cursor-pointer"
              >
                Register
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
