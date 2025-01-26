import React from 'react';
import Navbar from './components/Navbar';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import './App.css';
import Home from './components/pages/Home';
import Explore from './components/pages/Explore';
import Tickets from './components/pages/Tickets';
import SignUp from './components/pages/SignUp';
import TicketDetails from './components/pages/TicketDetails';

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path='/' exact element={<Home/>}/>
          <Route path='/explore' element={<Explore/>} />
          <Route path='/tickets' element={<Tickets/>} />
          <Route path='/tickets/:date' element={<TicketDetails/>} />
          <Route path='/sign-up' element={<SignUp/>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
