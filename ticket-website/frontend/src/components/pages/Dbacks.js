import React, {useState, useEffect} from "react";
import {useNavigate} from 'react-router-dom';
import './Dbacks.css';
import '../../App.css';
import Footer from '../Footer';

export default function Dbacks() {
    const [groupedTickets, setGroupedTickets] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/ticketsbsb')
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
        navigate(`/dbacks/${date}`);
    };

    return (
        <div className="tickets-container">
            <img src="/images/chasefield-2021-4.jpg" alt="Dbacks" className="hero-dbacks"/>
            <h1 className="tickets-title">Tickets by Game Date</h1>

            <div className="game-boxes">
                {Object.keys(groupedTickets).sort((a, b) => new Date(a) - new Date(b)).map(date => {
                    const game = groupedTickets[date][0];
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
            <Footer/>
        </div>
    );
}