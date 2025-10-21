// 🔗 Custom hook để xử lý current user logic - Tránh duplicate code
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setCurrentUser({
        id: user.id || 'me',
        username: user.username || user.name || 'Current User',
        email: user.email || 'user@example.com',
        avatar: user.avatar || null
      });
    }
  }, [user]);

  return currentUser;
};

export default useCurrentUser;