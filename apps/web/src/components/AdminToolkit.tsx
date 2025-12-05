"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Spinner,
} from "@soundsgood/ui";
import {
  Wrench,
  X,
  Users,
  Trash2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  Mail,
  Trash,
  RotateCcw,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  name: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export function AdminToolkit() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "invitations" | null>(null);
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // Invitations state
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);
  const [deletingInvitationId, setDeletingInvitationId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  
  // Reset state
  const [isResetting, setIsResetting] = useState(false);

  // Only render in development and on localhost
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocalhost = 
        window.location.hostname === "localhost" || 
        window.location.hostname === "127.0.0.1";
      setShouldRender(isLocalhost);
    }
  }, []);

  // Users functions
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        if (response.status === 403) {
          setUsersError("Admin access required");
          return;
        }
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setUsersError("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user "${email}"?\n\nThis will also delete their sessions, accounts, and invitations.`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to delete user");
        return;
      }

      // Refresh the list
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  // Invitations functions
  const fetchInvitations = async () => {
    setIsLoadingInvitations(true);
    setInvitationsError(null);
    try {
      const response = await fetch("/api/admin/invitations");
      if (!response.ok) {
        if (response.status === 403) {
          setInvitationsError("Admin access required");
          return;
        }
        throw new Error("Failed to fetch invitations");
      }
      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (err) {
      setInvitationsError("Failed to load invitations");
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string, email: string) => {
    if (!confirm(`Delete invitation for "${email}"?`)) {
      return;
    }

    setDeletingInvitationId(invitationId);
    try {
      const response = await fetch(`/api/admin/invitations?id=${invitationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to delete invitation");
        return;
      }

      fetchInvitations();
    } catch (err) {
      alert("Failed to delete invitation");
    } finally {
      setDeletingInvitationId(null);
    }
  };

  const handleClearAllInvitations = async () => {
    if (!confirm(`Are you sure you want to delete ALL invitations?\n\nThis cannot be undone.`)) {
      return;
    }

    setIsClearingAll(true);
    try {
      const response = await fetch("/api/admin/invitations?clearAll=true", {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || "Failed to clear invitations");
        return;
      }

      alert(data.message || "All invitations cleared");
      fetchInvitations();
    } catch (err) {
      alert("Failed to clear invitations");
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleOpenTab = (tab: "users" | "invitations") => {
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
      if (tab === "users") {
        fetchUsers();
      } else if (tab === "invitations") {
        fetchInvitations();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "accepted": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "expired": return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      case "revoked": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  // Reset database (keeps admin, clears everything else)
  const handleResetDatabase = async () => {
    if (!confirm("⚠️ RESET DATABASE?\n\nThis will delete:\n• All users (except you)\n• All invitations\n• All sessions (except yours)\n\nThis cannot be undone!")) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
      });

      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || "Failed to reset database");
        return;
      }

      alert(`✅ Database Reset Complete!\n\nDeleted:\n• ${data.deleted.users} users\n• ${data.deleted.accounts} accounts\n• ${data.deleted.sessions} sessions\n• ${data.deleted.invitations} invitations`);
      
      // Refresh the lists
      fetchUsers();
      fetchInvitations();
    } catch (err) {
      alert("Failed to reset database");
    } finally {
      setIsResetting(false);
    }
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
          isOpen 
            ? "bg-destructive text-destructive-foreground rotate-90" 
            : "bg-amber-500 text-white hover:bg-amber-600"
        }`}
        title="Admin Toolkit"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div className="fixed right-4 bottom-20 z-50 w-80 max-h-[70vh] overflow-hidden rounded-lg border bg-card shadow-2xl animate-in slide-in-from-right-5 duration-200">
          <div className="bg-amber-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="font-semibold">Admin Toolkit</span>
              <Badge variant="secondary" className="ml-auto text-xs bg-amber-600 text-white border-0">
                DEV ONLY
              </Badge>
            </div>
          </div>

          <div className="max-h-[calc(70vh-52px)] overflow-y-auto">
            {/* Users Section */}
            <div className="border-b">
              <button
                onClick={() => handleOpenTab("users")}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 font-medium text-sm">Manage Users</span>
                <Badge variant="secondary" className="text-[10px] mr-1">{users.length || "..."}</Badge>
                {activeTab === "users" ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {activeTab === "users" && (
                <div className="px-4 pb-4">
                  {/* Refresh Button */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {users.length} user{users.length !== 1 ? "s" : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchUsers}
                      disabled={isLoadingUsers}
                      className="h-7 text-xs"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingUsers ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>

                  {usersError && (
                    <div className="text-xs text-destructive bg-destructive/10 rounded p-2 mb-3">
                      {usersError}
                    </div>
                  )}

                  {isLoadingUsers ? (
                    <div className="flex justify-center py-4">
                      <Spinner size="sm" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-xs">
                              {user.name || "No name"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge 
                                variant="secondary" 
                                className={`text-[10px] px-1 py-0 ${
                                  user.role === "admin" 
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" 
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                              >
                                {user.role}
                              </Badge>
                              {user.emailVerified && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-[10px] px-1 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                >
                                  verified
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={deletingUserId === user.id || user.role === "admin"}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title={user.role === "admin" ? "Cannot delete admin users" : "Delete user"}
                          >
                            {deletingUserId === user.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}

                      {users.length === 0 && !isLoadingUsers && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No users found
                        </p>
                      )}
                    </div>
                  )}

                  {/* Warning */}
                  <div className="flex items-start gap-2 mt-3 p-2 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px]">
                      Deleting a user removes all their data including sessions, accounts, and invitations they sent.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Invitations Section */}
            <div className="border-b">
              <button
                onClick={() => handleOpenTab("invitations")}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 font-medium text-sm">Invitations</span>
                <Badge variant="secondary" className="text-[10px] mr-1">{invitations.length || "..."}</Badge>
                {activeTab === "invitations" ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {activeTab === "invitations" && (
                <div className="px-4 pb-4">
                  {/* Header with actions */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {invitations.length} invitation{invitations.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchInvitations}
                        disabled={isLoadingInvitations}
                        className="h-7 text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingInvitations ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  {/* Clear All Button */}
                  {invitations.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAllInvitations}
                      disabled={isClearingAll}
                      className="w-full mb-3 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    >
                      {isClearingAll ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <Trash className="h-3 w-3 mr-1" />
                          Clear All Invitations
                        </>
                      )}
                    </Button>
                  )}

                  {invitationsError && (
                    <div className="text-xs text-destructive bg-destructive/10 rounded p-2 mb-3">
                      {invitationsError}
                    </div>
                  )}

                  {isLoadingInvitations ? (
                    <div className="flex justify-center py-4">
                      <Spinner size="sm" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {invitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-xs">
                              {invitation.email}
                            </p>
                            {invitation.name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {invitation.name}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <Badge 
                                variant="secondary" 
                                className={`text-[10px] px-1 py-0 ${getStatusColor(invitation.status)}`}
                              >
                                {invitation.status}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvitation(invitation.id, invitation.email)}
                            disabled={deletingInvitationId === invitation.id}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete invitation"
                          >
                            {deletingInvitationId === invitation.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}

                      {invitations.length === 0 && !isLoadingInvitations && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No invitations found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reset Database Section */}
            <div className="p-4 border-t bg-destructive/5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="w-full h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                {isResetting ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset Database (Keep Admin)
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Deletes all users, invitations & sessions except yours
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

