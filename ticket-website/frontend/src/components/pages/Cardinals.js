import React, { useState, useEffect} from "react";
import {useNavigate} from 'react-router-dom';
import '../../App.css';
import './Cardinals.css';
import Footer from '../Footer';

export default function Cardinals() {
    const [groupedTickets, setGroupedTickets] = useState({});
    const navigate = useNavigate();
    
    useEffect(() => {
        fetch('http://localhost:5000/ticketsfb')
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
        navigate(`/cardinals/${date}`);
    };

    const isTBD = (date) => isNaN(Date.parse(date));

    return (
        <div className="tickets-container">
            <img src="/images/statefarm-stadium.jpg" alt="Cardinals" className="hero-cardinals"/>
            <h1 className="cardinals-title">Tickets by Game Date</h1>

            <div className="game-boxes">
                {Object.keys(groupedTickets)
                    .sort((a, b) => {
                        const isADate = !isTBD(a);
                        const isBDate = !isTBD(b);
                        
                        if (isADate && isBDate) {
                            return new Date(a) - new Date(b); // Sort actual dates
                        } 
                        if (!isADate && !isBDate) {
                            return a.localeCompare(b); // Sort TBD alphabetically (TBD1, TBD2, etc.)
                        }
                        return isADate ? -1 : 1; // Put real dates first, TBD dates last
                    })
                    .map(date => {
                        const game = groupedTickets[date][0];

                        const formatTeamName = (team) => {
                            return team.toLowerCase().replace(/\s+/g, '_');
                        };

                        return (
                            <div
                                key={date}
                                className="game-box"
                                onClick={() => handleGameBoxClick(date)}
                            >
                                <div className="game-info">
                                    <img 
                                        src={`/images/nfl-logos/${formatTeamName(game.away_team)}.png`} 
                                        alt={`${game.away_team} Logo`}
                                        className="team-logo"
                                    />
                                

                                <div className="game-text">
                                    <h3>{isTBD(date) ? "TBD" : date}</h3>
                                    <p>{game.away_team} at {game.home_team}</p>
                                    <p>{groupedTickets[date].length} Tickets Available</p>
                                </div>

                                <img 
                                    src={`/images/nfl-logos/${formatTeamName(game.home_team)}.png`}
                                    alt={`${game.home_team} Logo`}
                                    className="team-logo"
                                />
                                </div>
                            </div>
                        );
                    })}
            </div>
            <Footer/>
        </div>
    );
}