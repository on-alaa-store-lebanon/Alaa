import React, { useState } from "react";
import { Users, UserPlus, Trash2, Key, ShieldCheck, Mail, User as UserIcon, ShieldAlert, Eye, EyeOff, RefreshCw } from "lucide-react";
import { User, loadUsers, saveUsers, hashPassword, ROLE_LABELS, UserRole } from "../lib/auth";
import { sanitizeInput, loadSecurityLogs, clearSecurityLogs } from "../lib/security";

interface UsersTabProps {
  currentUser: User | null;
  showToast: (message: string, type?: "success" | "error") => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ currentUser, showToast }) => {
  const [users, setUsers] = useState<User[]>(() => loadUsers());
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  
  // Security audit trail logging states
  const [securityLogs, setSecurityLogs] = useState(() => loadSecurityLogs());
  const [showLogs, setShowLogs] = useState(false);

  const handleRefreshLogs = () => {
    setSecurityLogs(loadSecurityLogs());
    showToast("System security log updated", "success");
  };

  const handleClearLogs = () => {
    clearSecurityLogs();
    setSecurityLogs([]);
    showToast("System security log database purged", "success");
  };
  
  // New User Form fields
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("dispatcher");

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUsername.trim() || !newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      showToast("Please fill out all user fields", "error");
      return;
    }

    // Sanitize user inputs to prevent XSS / SQL Injection in credentials
    const sanitizedUsername = sanitizeInput(newUsername).toLowerCase();
    const sanitizedFullName = sanitizeInput(newFullName);
    const sanitizedEmail = sanitizeInput(newEmail);
    const sanitizedPassword = sanitizeInput(newPassword);

    if (!sanitizedUsername || !sanitizedFullName || !sanitizedEmail || !sanitizedPassword) {
      showToast("Blocked suspicious input characters in form.", "error");
      return;
    }
    
    // Check duplicates
    if (users.some((u) => u.username.toLowerCase() === sanitizedUsername)) {
      showToast("Username already exists", "error");
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: sanitizedUsername,
      fullName: sanitizedFullName,
      email: sanitizedEmail,
      role: newRole,
      passwordHash: hashPassword(sanitizedPassword),
    };

    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
    showToast(`User "${newUser.username}" created successfully!`, "success");

    // Reset Form
    setNewUsername("");
    setNewFullName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("dispatcher");
    setShowAddForm(false);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === "user-admin" || user.username === "admin") {
      showToast("The default Super Admin account cannot be deleted.", "error");
      return;
    }
    if (user.id === currentUser?.id) {
      showToast("You cannot delete your own currently active session.", "error");
      return;
    }

    setDeleteTarget(user);
  };

  const confirmDeleteUser = () => {
    if (!deleteTarget) return;
    const { id, username } = deleteTarget;
    if (id === "user-admin" || username === "admin") {
      showToast("The default Super Admin account cannot be deleted.", "error");
      setDeleteTarget(null);
      return;
    }
    if (id === currentUser?.id) {
      showToast("You cannot delete your own currently active session.", "error");
      setDeleteTarget(null);
      return;
    }

    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    saveUsers(updated);
    showToast(`User account "${username}" deleted successfully.`, "success");
    setDeleteTarget(null);
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "manager":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "dispatcher":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header section with toggle for creating a user */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Users size={14} className="text-yellow-500" />
          <span>Staff Accounts Directory</span>
        </span>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-[9px] font-black uppercase tracking-widest bg-[#0F172A] hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl transition active:scale-95 shadow-sm flex items-center gap-1 cursor-pointer"
        >
          <UserPlus size={10} strokeWidth={2.5} />
          <span>{showAddForm ? "Cancel" : "Add Account"}</span>
        </button>
      </div>

      {/* Add User form wrapper */}
      {showAddForm && (
        <form onSubmit={handleCreateUser} className="bg-slate-50 border-2 border-gray-100 rounded-2xl p-4.5 space-y-3.5 animate-slide-down shadow-sm">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block border-b border-gray-200/60 pb-1">
            Create Access Credentials
          </span>

          <div className="grid grid-cols-2 gap-3">
            {/* Username Field */}
            <div className="space-y-1">
              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest">
                Username
              </label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. samir99"
                className="w-full p-2.5 bg-white border-2 border-gray-200 rounded-xl text-xs outline-none focus:border-[#0F172A] font-bold transition"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest">
                Assigned Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full p-2.5 bg-white border-2 border-gray-200 rounded-xl text-xs outline-none focus:border-[#0F172A] font-bold transition"
              >
                <option value="dispatcher">Order Dispatcher</option>
                <option value="manager">Store Manager</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {/* Full Name Field */}
            <div>
              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="e.g. Samir Alameddine"
                className="w-full p-2.5 bg-white border-2 border-gray-200 rounded-xl text-xs outline-none focus:border-[#0F172A] font-bold transition"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. samir@onlymobilestore.lb"
                className="w-full p-2.5 bg-white border-2 border-gray-200 rounded-xl text-xs outline-none focus:border-[#0F172A] font-bold transition"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Set user password"
                className="w-full p-2.5 bg-white border-2 border-gray-200 rounded-xl text-xs outline-none focus:border-[#0F172A] font-bold transition"
              />
            </div>
          </div>

          {/* Role Description Card */}
          <div className="bg-[#0F172A]/5 rounded-xl p-3 border border-slate-200 text-[10px] space-y-1">
            <span className="font-black text-slate-800 uppercase block tracking-wider">Role Permissions Summary:</span>
            {newRole === "super_admin" && (
              <p className="text-slate-500 font-bold">Has unrestricted access to view/edit Products, handle Orders, change Store Branding settings, and add/delete user accounts.</p>
            )}
            {newRole === "manager" && (
              <p className="text-slate-500 font-bold">Has permission to edit Products and view/update Orders. Cannot access Store Branding or edit Team accounts.</p>
            )}
            {newRole === "dispatcher" && (
              <p className="text-slate-500 font-bold">Dedicated staff dashboard. Access is restricted exclusively to reading and managing incoming Orders. Cannot modify products, customizer, or team accounts.</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest transition active:scale-95 shadow-md cursor-pointer"
          >
            Create Staff Account
          </button>
        </form>
      )}

      {/* Directory listings */}
      <div className="space-y-2.5">
        {users.map((u) => (
          <div
            key={u.id}
            className="border-2 border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-3 bg-white shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                <UserIcon size={18} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">
                    {u.fullName}
                  </h4>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 border rounded-full tracking-wider shrink-0 ${getRoleBadgeStyle(u.role)}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </div>
                <div className="flex flex-col text-[10px] text-slate-400 mt-1 font-bold space-y-0.5">
                  <span className="flex items-center gap-1">
                    <Key size={10} /> {u.username}
                  </span>
                  <span className="flex items-center gap-1 truncate">
                    <Mail size={10} /> {u.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Delete button (Super Admins only can delete accounts, and cannot delete own account or default admin) */}
            {u.id !== "user-admin" && u.username !== "admin" && u.id !== currentUser?.id && (
              <button
                type="button"
                onClick={() => handleDeleteUser(u)}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-all shrink-0 cursor-pointer border border-transparent hover:border-red-100"
                title="Delete Account"
              >
                <Trash2 size={15} strokeWidth={2.5} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* High-Security Staff Deletion Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-3 border-[#0F172A] rounded-3xl p-6 max-w-sm w-full shadow-[8px_8px_0px_#000] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={20} strokeWidth={2.5} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Revoke Credentials & Delete
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-800">"{deleteTarget.fullName}"</strong>? This will immediately revoke all access permissions, purge their user profile, and erase them from the database.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[3px_3px_0px_#000] border border-slate-900"
              >
                Yes, Revoke
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 2. Collapsible Security Logs Section */}
      <div id="system-security-audit-panel" className="bg-[#0F172A] border-2 border-slate-800 rounded-3xl p-4 text-white shadow-lg mt-6">
        <button
          type="button"
          onClick={() => {
            setShowLogs(!showLogs);
            setSecurityLogs(loadSecurityLogs());
          }}
          className="w-full flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-red-400 animate-pulse" />
            <span>Security & System Monitoring Logs</span>
            <span className="bg-red-950/80 border border-red-900/60 text-red-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
              {securityLogs.length} Events
            </span>
          </span>
          <span className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-1 rounded-xl transition font-black">
            {showLogs ? "Hide Console" : "View Console"}
          </span>
        </button>

        {showLogs && (
          <div className="mt-4 space-y-3 animate-slide-down border-t border-slate-800/80 pt-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Live Terminal Audit Trail:
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRefreshLogs}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Refresh Audit Trail"
                >
                  <RefreshCw size={11} strokeWidth={2.5} />
                </button>
                {currentUser?.role === "super_admin" && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="text-[8px] font-black uppercase tracking-widest text-red-400 bg-red-950/40 border border-red-900/40 hover:bg-red-950/60 px-2 py-1 rounded-lg transition"
                  >
                    Purge Logs
                  </button>
                )}
              </div>
            </div>

            {securityLogs.length === 0 ? (
              <div className="text-center py-6 bg-white/5 rounded-2xl border border-slate-800 text-slate-500">
                <ShieldCheck size={24} className="mx-auto mb-2 opacity-30 text-slate-400 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-300">No Security Threats Logged</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">System database and administrator ports secure.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                {securityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#1E293B]/50 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-1 text-[10px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider leading-none ${
                        log.event === "FAILED_LOGIN" || log.event === "UNAUTHORIZED_ACCESS"
                          ? "bg-red-950/80 text-red-400 border border-red-900/40"
                          : log.event === "SESSION_TIMEOUT"
                          ? "bg-amber-950/80 text-amber-400 border border-amber-900/40"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}>
                        {log.event}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-200">
                      User: <strong className="text-white font-black">{log.username}</strong>
                    </p>
                    <p className="text-slate-400 font-medium leading-relaxed leading-snug">
                      {log.details}
                    </p>
                    <p className="text-[8px] text-slate-500 font-mono">
                      IP: {log.ipAddress}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
