import { useState } from 'react';
import Login from './pages/Login';
import MainPage from './pages/MainPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <MainPage onLogout={() => setIsAuthenticated(false)} />;
}

export default App;
