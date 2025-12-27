import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";

interface User {
  id: string;
  username: string;
  publicKey: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await api.getUsers();
      console.log("useUsers - Loaded users:", fetchedUsers.length, fetchedUsers);
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    // Refresh users every 30 seconds (less frequent to avoid rate limiting)
    const interval = setInterval(loadUsers, 30000);
    return () => clearInterval(interval);
  }, [loadUsers]);

  return {
    users,
    isLoading,
    error,
    refresh: loadUsers,
  };
}

