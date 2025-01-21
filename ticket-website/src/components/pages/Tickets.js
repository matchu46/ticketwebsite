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
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                // Process the data to ensure numeric values
                const processedData = data.map(ticket => ({
                    ...ticket,
                    price: typeof ticket.price === 'string' 
                        ? parseFloat(ticket.price.replace('$', '').replace(',', ''))
                        : ticket.price,
                    est_price: typeof ticket.est_price === 'string'
                        ? parseFloat(ticket.est_price.replace('$', '').replace(',', ''))
                        : ticket.est_price
                }));
                setTickets(processedData);
            })
            .catch((error) => console.error('Error fetching ticket data:', error));
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
        // Ensure price is a number before filtering
        const price = typeof ticket.price === 'string' 
            ? parseFloat(ticket.price.replace('$', '').replace(',', ''))
            : ticket.price;

        return price >= minPrice && price <= maxPrice; // Filter by price range
    })
    .sort((a, b) => {
        if (sortBy === 'price') {
            const priceA = typeof a.price === 'string' 
                ? parseFloat(a.price.replace('$', '').replace(',', ''))
                : a.price;
            const priceB = typeof b.price === 'string' 
                ? parseFloat(b.price.replace('$', '').replace(',', ''))
                : b.price;

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
                    <label>
                        Min Price:
                        <input
                            type="number"
                            name="minPrice"
                            value={minPrice}
                            onChange={handlePriceChange}
                            min="0"
                        />
                    </label>
                    <label>
                        Max Price:
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
                    <label>
                        Sort By:
                        <select name="sortBy" onChange={handleSortChange} value={sortBy}>
                            <option value="section">Section</option>
                            <option value="price">Price</option>
                        </select>
                    </label>
                    <label>
                        Sort Direction:
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
                            <th>Date</th>
                            <th>Section</th>
                            <th>Row</th>
                            <th>Estimated Price After Taxes</th>
                            <th>Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedTickets.map((ticket, index) => (
                            <tr key={index}>
                                <td>{ticket.date}</td>
                                <td>{ticket.section}</td>
                                <td>{ticket.row}</td>
                                <td>${(ticket.estimated_price ?? 0).toFixed(2)}</td>
                                <td>
                                    <a href={ticket.url} target="_blank" rel="noopener noreferrer">
                                        <td>{ticket.source}</td>
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <Footer />
        </div>
    );
}
