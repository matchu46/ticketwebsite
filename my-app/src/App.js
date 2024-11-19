// App.js
import React, { useState } from 'react';
import './App.css'; 

function App() {
  const [isMenuActive, setIsMenuActive] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuActive(!isMenuActive);
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar__toggle" id="mobile-menu" onClick={handleMenuToggle}>
          <span className={isMenuActive ? 'bar is-active' : 'bar'}></span>
          <span className={isMenuActive ? 'bar is-active' : 'bar'}></span>
          <span className={isMenuActive ? 'bar is-active' : 'bar'}></span>
        </div>
        <div className={`navbar__menu ${isMenuActive ? 'active' : ''}`}>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Tech</a></li>
            <li><a href="#">Products</a></li>
          </ul>
        </div>
      </nav>
    </div>
  );
}

export default App;
