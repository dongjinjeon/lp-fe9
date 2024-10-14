import React, { useState } from 'react';
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Login from './components/Login';
import Payments from './pages/common/Payments';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <div className="App">
        {!isLoggedIn ? (
          <Login onLogin={handleLogin} />
        ) : (
          <div>
            <h1>환영합니다!</h1>
            <Link to="/payments" className="coin-recharge-button">
              코인 충전
            </Link>
            <Routes>
              <Route path="/payments" element={<Payments />} />
            </Routes>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;