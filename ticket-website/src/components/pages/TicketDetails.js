import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TicketDetails.css';

export default function TicketDetails() {
    const { date } = useParams(); // Get the game date from the URL
    const [tickets, setTickets] = useState([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(1000);
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
                const filteredTickets = data.filter(ticket => ticket.date === date);
                setTickets(filteredTickets);
            })
            .catch((error) => console.error('Error fetching ticket data:', error));
    }, [date]);

    const filteredTickets = tickets.filter(ticket => 
        ticket.price >= minPrice && ticket.price <= maxPrice
    );

    return (
        <div className="ticket-details-container">
            <button className="back-button" onClick={() => navigate('/tickets')}>
                Back to Games
            </button>
            <h1>Tickets for {date}</h1>
            <img src="/images/footprint_seating_chart.png" alt="Seating Chart" className="seating-chart"/>

            {/* Price Filters */}
            <div className="filters">
                <label>
                    Min Price:
                    <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                    />
                </label>
                <label>
                    Max Price:
                    <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                    />
                </label>
            </div>

            {/* Tickets Table */}
            {filteredTickets.length === 0 ? (
                <p>No tickets available in this price range.</p>
            ) : (
                <table className="tickets-table">
                    <thead>
                        <tr>
                            <th>Section</th>
                            <th>Row</th>
                            <th>Est. Price</th>
                            <th>Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.map((ticket, index) => (
                            <tr key={index}>
                                <td>{ticket.section}</td>
                                <td>{ticket.row}</td>
                                <td>${ticket.price.toFixed(2)}</td>
                                <td>
                                    <a href={ticket.url} target="_blank" rel="noopener noreferrer">
                                        {ticket.source}
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
