import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';
import './Tickets.css';
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
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const futureGames = data.filter(ticket => {
                    const gameDate = new Date(ticket.date);
                    return gameDate >= today;
                });

                const grouped = futureGames.reduce((acc, ticket) => {
                    acc[ticket.date] = acc[ticket.date] || [];
                    acc[ticket.date].push(ticket);
                    return acc;
                }, {});
                setGroupedTickets(grouped);
            })
            .catch((error) => console.error('Error fetching ticket data:', error));
    }, []);

    const handleGameBoxClick = (date) => {
        navigate(`/suns/${date}`); // Navigate to the Ticket Details page
    };

    return (
        <div className="tickets-container">
            <img src="/images/suns_event.webp" alt="Suns" className="hero-suns"/>
            <h1 className="suns-title">Tickets by Game Date</h1>
    
            {/* Game Boxes */}
            <div className="game-boxes">
                {Object.keys(groupedTickets).sort((a, b) => new Date(a) - new Date(b)).map(date => {
                    // Assuming the first ticket for each date contains the home and away teams
                    const game = groupedTickets[date][0]; // Get the first ticket for the date

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
                                src={`/images/nba-logos/${formatTeamName(game.away_team)}.png`} 
                                alt={`${game.away_team} Logo`}
                                className="team-logo"
                            />

                            <div className="game-text">
                                <h3>{date}</h3>
                                <p>{game.away_team} at {game.home_team}</p>
                                <p>{groupedTickets[date].length} Tickets Available</p>
                            </div>

                            <img 
                                src={`/images/nba-logos/${formatTeamName(game.home_team)}.png`}
                                alt={`${game.home_team} Logo`}
                                className="team-logo"
                            />
                        </div>
                        </div>
                    );
                })}
            </div>
            <Footer />
        </div>
    );
    
}
