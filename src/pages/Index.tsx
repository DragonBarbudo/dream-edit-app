import { useState, useEffect } from 'react';
import { Login } from '@/components/Login';
import { MainApp } from '@/components/MainApp';
import { isAuthenticated } from '@/lib/auth';

const Index = () => {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return <MainApp onLogout={() => setAuthenticated(false)} />;
};

export default Index;
