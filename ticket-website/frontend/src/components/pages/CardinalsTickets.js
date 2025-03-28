import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './TicketDetails.css';
import SeatingChart from './SeatingChart';
import { Button } from '../Button';

export default function CardinalsTickets() {
    const { date } = useParams();
    const [tickets, setTickets] = useState([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(10000);
    const [sortColumns, setSortColumns] = useState([]); // No sorting initially
    const [selectedSource, setSelectedSource] = useState("all");
    const [selectedSection, setSelectedSection] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/ticketsfb')
            .then(response => response.json())
            .then(data => setTickets(data.filter(ticket => ticket.date === date)))
            .catch(error => console.error('Error fetching ticket data:', error));
    }, [date]);

    const handleSort = (column) => {
        setSortColumns((prevSortColumns) => {
            const existingIndex = prevSortColumns.findIndex(sort => sort.column === column);

            if (existingIndex !== -1) {
                const updatedSortColumns = [...prevSortColumns];

                if (updatedSortColumns[existingIndex].order === 'asc') {
                    updatedSortColumns[existingIndex].order = 'desc'; // Toggle to descending
                } else {
                    updatedSortColumns.splice(existingIndex, 1); // Remove sorting
                }
                return updatedSortColumns;
            } else {
                return [...prevSortColumns, { column, order: 'asc' }]; // Add new column with ascending order
            }
        });
    };

    const filteredTickets = tickets
        .filter(ticket => ticket.estimated_price >= minPrice && ticket.estimated_price <= maxPrice)
        .filter(ticket => selectedSource === "all" || ticket.source === selectedSource)
        .filter(ticket => !selectedSection || ticket.section === selectedSection);

    const sortedTickets = [...filteredTickets].sort((a, b) => {
        for (const { column, order } of sortColumns) {
            let comparison = 0;

            if (column === 'estimated_price') {
                comparison = a[column] - b[column];
            } else {
                comparison = a[column].toString().localeCompare(b[column].toString(), undefined, { numeric: true });
            }

            if (comparison !== 0) {
                return order === 'asc' ? comparison : -comparison;
            }
        }
        return 0;
    });
    
    const getSortIndicator = (column) => {
        const sortObj = sortColumns.find(sc => sc.column === column);
        return sortObj ? (sortObj.order === "asc" ? "▲" : "▼") : "";
    }; 
    
    return (
        <div className="page-container">
            <div className="main-content">
                {/* Left Column: Game info, filters, and seating chart */}
                <div className="left-column">
                    <div className="hero-btns">
                        <Button 
                            className='btns' 
                            buttonStyle='btn--outline'
                            buttonSize='btn--medium'
                            to='/cardinals'
                        >
                            Back to Games
                        </Button>
                    </div>
                    <div className="ticket-info">
                        <h1 className="tickets-title">
                            {tickets.length > 0 ? `${tickets[0].home_team} vs ${tickets[0].away_team}` : "Loading..."}
                        </h1>
                        <p className="game-details">
                            {tickets.length > 0 ? `${tickets[0].date} - State Farm Stadium` : ""}
                        </p>
                    </div>
    
                    {/* Filters */}
                    <div className="controls-container">
                        <div className="price-range">
                            <label>Min Price:
                                <input type="number" value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))} />
                            </label>
                            <label>Max Price:
                                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
                            </label>
                        </div>
                        <div className="source-filter">
                            <label>Ticket Source:
                                <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
                                    <option value="all">All Sources</option>
                                    <option value="Gametime">Gametime</option>
                                    <option value="StubHub">StubHub</option>
                                    <option value="TickPick">TickPick</option>
                                    <option value="Vivid Seats">Vivid Seats</option>
                                </select>
                            </label>
                        </div>
                    </div>
    
                    {/* Seating Chart */}
                    <div className="seating-container">
                        <SeatingChart onSelectSection={setSelectedSection} stadiumFile={`/images/statefarm-seating-chart.svg`} />
                    </div>
                </div>
    
                {/* Right Column: Tickets Table */}
                <div className="right-column">
                    {filteredTickets.length === 0 ? (
                        <p className="no-tickets">No tickets available in this price range.</p>
                    ) : (
                        <table className="tickets-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort("section")}>Section {getSortIndicator("section")}</th>
                                    <th onClick={() => handleSort("row")}>Row {getSortIndicator("row")}</th>
                                    <th onClick={() => handleSort("estimated_price")}>Est. Price {getSortIndicator("estimated_price")}</th>
                                    <th onClick={() => handleSort("source")}>Source {getSortIndicator("source")}</th>
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
            </div>
        </div>
    );
}