import React, {useState, useEffect} from "react";
import {useNavigate} from 'react-router-dom';
import '../../App.css';
import './Concerts.css';
import Footer from '../Footer';

export default function Concerts() {
    const [groupedTickets, setGroupedTickets] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/ticketscon')
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
            })

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
        navigate(`/concerts/${date}`);
    };

    return (
        <div className="tickets-container">
            <img src="/images/statefarm-stadium-concert.jpg" alt="Concerts" className="hero-concerts"/>
            <h1 className="concerts-title">Tickets by Concert Date</h1>

            <div className="game-boxes">
                {Object.keys(groupedTickets).sort((a, b) => new Date(a) - new Date(b)).map(date => {
                    const game = groupedTickets[date][0];

                    // Helper function to format team names for image files (convert spaces to underscores and lowercase)
                    const formatTeamName = (team) => {
                        return team.toLowerCase().replace(/\s+/g, '_');
                    };

                    return (
                        <div
                            key={date}
                            className="game-box"
                            onClick={() => handleGameBoxClick(date)}
                        >
                            {/* Game Info Section with Team Logos */}
                            <div className="game-info">
                                <img 
                                    src={`/images/concert-logos/${formatTeamName(game.away_team)}.png`} 
                                    alt={`${game.away_team} Logo`} 
                                    className="team-logo"
                                />
                                
                                <div className="game-text">
                                    <h3>{date}</h3>
                                    <p>{game.away_team} at {game.home_team}</p>
                                    <p>{groupedTickets[date].length} Tickets Available</p>
                                </div>
    
                                <img 
                                    src={`/images/concert-logos/${formatTeamName(game.away_team)}.png`} 
                                    alt={`${game.away_team} Logo`} 
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