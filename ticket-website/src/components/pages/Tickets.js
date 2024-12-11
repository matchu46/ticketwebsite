import React, { useState, useEffect } from 'react';
import '../../App.css';
import './Tickets.css';
import Footer from '../Footer';

export default function Tickets() {
    const [tickets, setTickets] = useState([]);
    const [sortBy, setSortBy] = useState('section');
    const [sortDirection, setSortDirection] = useState('asc');
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(1000); // Default max price is 1000

    useEffect(() => {
        fetch('http://localhost:5000/tickets')
            .then((response) => response.json())
            .then((data) => setTickets(data));
    }, []);

    const handleSortChange = (e) => {
        const { name, value } = e.target;
        if (name === 'sortBy') {
            setSortBy(value);
        } else if (name === 'sortDirection') {
            setSortDirection(value);
        }
    };

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        if (name === 'minPrice') {
            setMinPrice(Number(value));
        } else if (name === 'maxPrice') {
            setMaxPrice(Number(value));
        }
    };

    // Filtering and Sorting tickets
    const filteredAndSortedTickets = [...tickets]
        .filter((ticket) => {
            const price = parseFloat(ticket.price.replace('$', '').replace(',', ''));
            return price >= minPrice && price <= maxPrice; // Filter by price range
        })
        .sort((a, b) => {
            if (sortBy === 'price') {
                const priceA = parseFloat(a.price.replace('$', '').replace(',', ''));
                const priceB = parseFloat(b.price.replace('$', '').replace(',', ''));
                return sortDirection === 'asc' ? priceA - priceB : priceB - priceA;
            } else if (sortBy === 'section') {
                return sortDirection === 'asc' ? a.section - b.section : b.section - a.section;
            }
            return 0;
        });

    return (
        <div className="tickets-container">
            <h1 className="tickets-title">Ticket Prices</h1>
            
            <div className="filters">
                <div className="price-range">
                    <label>Min Price: 
                        <input
                            type="number"
                            name="minPrice"
                            value={minPrice}
                            onChange={handlePriceChange}
                            min="0"
                        />
                    </label>
                    <label>Max Price: 
                        <input
                            type="number"
                            name="maxPrice"
                            value={maxPrice}
                            onChange={handlePriceChange}
                            min="0"
                        />
                    </label>
                </div>
                <div className="sort-controls">
                    <label>Sort By: 
                        <select name="sortBy" onChange={handleSortChange} value={sortBy}>
                            <option value="section">Section</option>
                            <option value="price">Price</option>
                        </select>
                    </label>
                    <label>Sort Direction: 
                        <select name="sortDirection" onChange={handleSortChange} value={sortDirection}>
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </label>
                </div>
            </div>

            {filteredAndSortedTickets.length === 0 ? (
                <p>No tickets found in the selected price range.</p>
            ) : (
                <table className="tickets-table">
                    <thead>
                        <tr>
                            <th>Section</th>
                            <th>Row</th>
                            <th>Price</th>
                            <th>Estimated Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedTickets.map((ticket, index) => (
                            <tr key={index}>
                                <td>{ticket.section}</td>
                                <td>{ticket.row}</td>
                                <td>{ticket.price}</td>
                                <td>{ticket.estPrice}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <Footer />
        </div>
    );
}