import React from 'react';
import Navbar from './components/Navbar';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import './App.css';
import Home from './components/pages/Home';
import Dbacks from './components/pages/Dbacks';
import Tickets from './components/pages/Tickets';
import SignUp from './components/pages/SignUp';
import TicketDetails from './components/pages/TicketDetails';
import DbacksTickets from './components/pages/DbacksTickets';
import Concerts from './components/pages/Concerts';
import ConcertsTickets from './components/pages/ConcertsTickets';

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path='/' exact element={<Home/>}/>
          <Route path='/dbacks' element={<Dbacks/>} />
          <Route path='/dbacks/:date' element={<DbacksTickets/>} />
          <Route path='/suns' element={<Tickets/>} />
          <Route path='/suns/:date' element={<TicketDetails/>} />
          <Route path='/sign-up' element={<SignUp/>} />
          <Route path='/concerts' element={<Concerts/>} />
          <Route path='/concerts/:date' element={<ConcertsTickets/>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
