import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserSession {
  userId: string | null;
  isLoggedIn: boolean;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
}

interface UserSessionContextType extends UserSession {
  updateSession: (session: Partial<UserSession>) => void;
  clearSession: () => void;
}

const defaultSession: UserSession = {
  // userId: 'kp_62e98794d77f420b85189543a8ac0458',//TODO: revert this
  userId:'user1',
  // userId: null,
  isLoggedIn: false,
  firstName: null,
  lastName:null,
  profileImage: null,
};

// Create context
const UserSessionContext = createContext<UserSessionContextType>({
  ...defaultSession,
  updateSession: () => {},
  clearSession: () => {},
});

// Create provider component
export const UserSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>(defaultSession);

  const updateSession = (newSession: Partial<UserSession>) => {
    setSession((prevSession) => ({
      ...prevSession,
      ...newSession,
    }));
  };

  const clearSession = () => {
    setSession(defaultSession);
  };

  return (
    <UserSessionContext.Provider value={{ ...session, updateSession, clearSession }}>
      {children}
    </UserSessionContext.Provider>
  );
};

// Custom hook to use session context
export const useUserSession = () => {
  return useContext(UserSessionContext);
};