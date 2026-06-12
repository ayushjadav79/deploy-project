import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login    from './pages/Login';
import Register from './pages/Register';
import Home     from './pages/Home';

const App = () => {
  const [_isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/login"    element={<Login    setAuth={setIsAuthenticated} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/"         element={<Home     setAuth={setIsAuthenticated} />} />
          <Route path="*"         element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
