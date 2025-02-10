import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Tickets.css';
import '../../App.css';
import Footer from '../Footer';

export default function Tickets() {
    const [groupedTickets, setGroupedTickets] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/tickets')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                const grouped = data.reduce((acc, ticket) => {
                    acc[ticket.date] = acc[ticket.date] || [];
                    acc[ticket.date].push(ticket);
                    return acc;
                }, {});
                setGroupedTickets(grouped);
            })
            .catch((error) => console.error('Error fetching ticket data:', error));
    }, []);

    const handleGameBoxClick = (date) => {
        navigate(`/tickets/${date}`); // Navigate to the Ticket Details page
    };

    return (
        <div className="tickets-container">
            <img src="/images/suns_event.webp" alt="Suns" className="hero-suns"/>
            <h1 className="tickets-title">Tickets by Game Date</h1>
    
            {/* Game Boxes */}
            <div className="game-boxes">
                {Object.keys(groupedTickets).sort((a, b) => new Date(a) - new Date(b)).map(date => {
                    // Assuming the first ticket for each date contains the home and away teams
                    const game = groupedTickets[date][0]; // Get the first ticket for the date
                    return (
                        <div
                            key={date}
                            className="game-box"
                            onClick={() => handleGameBoxClick(date)}
                        >
                            <h3>{date}</h3>
                            <p>{game.away_team} at {game.home_team}</p>
                            <p>{groupedTickets[date].length} Tickets Available</p>
                        </div>
                    );
                })}
            </div>
            <Footer />
        </div>
    );
    
}
