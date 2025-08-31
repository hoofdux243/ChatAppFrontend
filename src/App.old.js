import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ChatProvider } from './context/ChatContext';
import Login from './components/Login';
import ChatPage from './pages/ChatPage';
import './App.css';

// Protected Route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
        import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SimpleAuthProvider, useSimpleAuth } from './hooks/useSimpleAuth';
import { ChatProvider } from './context/ChatContext';
import SimpleLogin from './components/SimpleLogin';
import ChatPage from './pages/ChatPage';
import './App.css';

// Protected Route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSimpleAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<SimpleLogin />} />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/contacts" 
          element={
            <ProtectedRoute>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
              }}>
                <h2>Contacts Page (Coming Soon)</h2>
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
              }}>
                <h2>Settings Page (Coming Soon)</h2>
              </div>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <SimpleAuthProvider>
      <ChatProvider>
        <Router>
          <AppContent />
        </Router>
      </ChatProvider>
    </SimpleAuthProvider>
  );
}

export default App;
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <AppContent />
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
