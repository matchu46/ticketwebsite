import React, {useState} from 'react'
import {Link} from 'react-router-dom';

function Navbar() {
  const [click, setClick] = useState(false);
  
  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);
  return (
    <>
      <nav className="navbar">
        <div class="navbar-container">
          <Link to="/" className="navbar-logo">
            AZTickets <i className='fas fa-ticket-alt' />
          </Link>
          <div class='menu-icon' onClick={handleClick}>
            <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
          </div>
          <ul className={click ? 'nav-menu active' : 'nav-menu'}>
            <li className='nav-item'>
              <Link to='/' className='nav-links' onClick={closeMobileMenu}>
               Home
              </Link>
            </li>
            <li className='nav-item'>
              <Link to='/explore' className='nav-links' onClick={closeMobileMenu}>
               Explore
              </Link>
            </li>
            <li className='nav-item'>
              <Link to='/tickets' className='nav-links' onClick={closeMobileMenu}>
               Tickets
              </Link>
            </li>
            <li className='nav-item'>
              <Link to='/sign-up' className='nav-links-mobile' onClick={closeMobileMenu}>
               Sign Up
              </Link>
            </li>  
          </ul>  
        </div>
      </nav>
    </>
  )
}

export default Navbar;
