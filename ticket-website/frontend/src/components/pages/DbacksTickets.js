import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SeatingChart from './SeatingChart';
import './DbacksTickets.css';
import { Button } from "../Button";

export default function DbacksTickets() {
    const { date } = useParams();
    console.log('Date from URL:', date);
    const [tickets, setTickets] = useState([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(1000);
    const [sortOption, setSortOption] = useState('estimated_price');
    //const navigate = useNavigate();
    const [selectedSource, setSelectedSource] = useState("all");
    const [selectedSection, setSelectedSection] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/ticketsbsb')
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

    const filteredTickets = tickets
        .filter(ticket => ticket.estimated_price >= minPrice && ticket.estimated_price <= maxPrice)
        .filter(ticket => selectedSource === "all" || ticket.source === selectedSource)
        .filter(ticket => !selectedSection || ticket.section === selectedSection);

    const sortedTickets = [...filteredTickets].sort((a, b) => {
        if (sortOption === 'estimated_price') {
            return a.estimated_price - b.estimated_price;
        } else if (sortOption === 'source') {
            return a.source.localeCompare(b.source);
        }
        return 0;
    });

    return (
        <div className="ticket-details-container">
            <div className="hero-btns">
                <Button 
                    className='btns' 
                    buttonStyle='btn--outline'
                    buttonSize='btn--large'
                    to='/dbacks'
                >
                    Back to Games
                </Button>
            </div> 
    
            <h1>Tickets for {date}</h1>
            <SeatingChart onSelectSection={setSelectedSection} />
    
            {/* Controls Container for Sorting and Filtering */}
            <div className="controls-container">
                {/* Price Range Filters */}
                <div className="price-range">
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
    
                {/* Sorting Options */}
                <div className="sort-controls">
                    <label>
                        Sort by:
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="estimated_price">Cheapest Price</option>
                            <option value="source">Source (Website)</option>
                        </select>
                    </label>
                </div>

                <div className="source-filter">
                    <label>
                        Ticket Source:
                        <select 
                            value={selectedSource} 
                            onChange={(e) => setSelectedSource(e.target.value)}
                        >
                            <option value="all">All Sources</option>
                            <option value="Gametime">GameTime</option>
                            <option value="StubHub">StubHub</option>
                            <option value="TickPick">TickPick</option>
                        </select>
                    </label>
                </div>
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
                        {sortedTickets.map((ticket, index) => (
                            <tr key={index}>
                                <td>{ticket.section}</td>
                                <td>{ticket.row}</td>
                                <td>${ticket.estimated_price.toFixed(2)}</td>
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