import React, { useState, useEffect, useRef } from 'react';
import ReactSlider from 'react-slider';
import { useParams } from 'react-router-dom';
import './TicketDetails.css';
import SeatingChart from './SeatingChart';
import { Button } from '../Button';

export default function TicketDetails() {
    const { date } = useParams();
    const [tickets, setTickets] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [sortColumns, setSortColumns] = useState([]); // No sorting initially
    const [selectedSource, setSelectedSource] = useState("all");
    const [selectedSection, setSelectedSection] = useState(null);

    // Calculate min and max prices dynamically when tickets are loaded
    const [minPossiblePrice, setMinPossiblePrice] = useState(0);
    const [maxPossiblePrice, setMaxPossiblePrice] = useState(1000);
            
    // State to track if price filter dropdown is open
    const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false);
            
    // Reference to the price button to position the dropdown
    const priceButtonRef = useRef(null);

    useEffect(() => {
        console.log("Fetching tickets for date:", date);
            
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
        
            if (filteredTickets.length > 0) {
                // Get the actual min and max prices from ticket data
                const prices = filteredTickets.map(ticket => ticket.price);
                const dynamicMinPrice = Math.floor(Math.min(...prices));
                const dynamicMaxPrice = Math.ceil(Math.max(...prices));
    
                setMinPossiblePrice(dynamicMinPrice);
                setMaxPossiblePrice(dynamicMaxPrice);
                        
                // Set initial price range to full ticket price range
                setPriceRange([dynamicMinPrice, dynamicMaxPrice]);
            }
        })
        .catch((error) => console.error('Error fetching ticket data:', error));
    }, [date]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (isPriceFilterOpen && 
                priceButtonRef.current && 
                !priceButtonRef.current.contains(event.target) && 
                !event.target.closest('.price-filter-dropdown')) {
                setIsPriceFilterOpen(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isPriceFilterOpen]);

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
        .filter(ticket => ticket.estimated_price >= priceRange[0] && ticket.estimated_price <= priceRange[1])
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

    const handleClearFilters = () => {
        // Reset price range to min and max possible prices
        setPriceRange([minPossiblePrice, maxPossiblePrice]);
        setSelectedSource("all"); // Reset ticket source dropdown
        setSortColumns([]); // Clear sorting options
        setSelectedSection(null); // Clear selected section in seating chart
    };

    // Handle manual input for min price
    const handleMinPriceInput = (e) => {
        const newMinPrice = parseInt(e.target.value) || minPossiblePrice;
        if (newMinPrice <= priceRange[1]) {
            setPriceRange([newMinPrice, priceRange[1]]);
        }
    };
    
    // Handle manual input for max price
    const handleMaxPriceInput = (e) => {
        const newMaxPrice = parseInt(e.target.value) || maxPossiblePrice;
        if (newMaxPrice >= priceRange[0]) {
            setPriceRange([priceRange[0], newMaxPrice]);
        }
    };

    // Toggle price filter dropdown
    const togglePriceFilter = () => {
        setIsPriceFilterOpen(!isPriceFilterOpen);
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
                            to='/suns'
                        >
                            Back to Games
                        </Button>
                    </div>
                    <div className="ticket-info">
                        <h1 className="suns-tickets-title">
                        {tickets.length > 0 ? `${tickets[0].home_team} vs ${tickets[0].away_team}` : "Loading..."}
                        </h1>
                        <p className="game-details">
                            {tickets.length > 0 ? `${tickets[0].date} - PHX Arena` : ""}
                        </p>
                    </div>
    
                    {/* Filter buttons row - with relative positioning */}
                    <div className="filter-buttons-row">
                        <div className="price-filter-button-container" ref={priceButtonRef}>
                            <Button 
                                className='btns' 
                                buttonStyle='btn--outline'
                                buttonSize='btn--medium'
                                onClick={togglePriceFilter}
                            >
                                ${priceRange[0]} - ${priceRange[1]} {isPriceFilterOpen ? '▲' : '▼'}
                            </Button>
                            
                            {/* Price Range Filter Dropdown - with absolute positioning */}
                            {isPriceFilterOpen && (
                                <div className="price-filter-dropdown">
                                    <div className="price-filter-container">
                                        <h3>Price Range Filter</h3>
                                        <div className="price-slider-container">
                                            <ReactSlider
                                                className="price-slider"
                                                thumbClassName="price-slider-thumb"
                                                trackClassName="price-slider-track"
                                                value={priceRange}
                                                onChange={setPriceRange}
                                                min={minPossiblePrice}
                                                max={maxPossiblePrice}
                                                ariaLabel={['Lower price', 'Upper price']}
                                                ariaValuetext={state => `$${state.valueNow}`}
                                                pearling
                                                minDistance={10}
                                            />
                                            <div className="price-range-display">
                                                <div className="price-input-group">
                                                    <label htmlFor="min-price-input">Min:</label>
                                                    <input
                                                        id="min-price-input"
                                                        type="number"
                                                        value={priceRange[0]}
                                                        onChange={handleMinPriceInput}
                                                        min={minPossiblePrice}
                                                        max={priceRange[1]}
                                                    />
                                                </div>
                                                <div className="price-input-group">
                                                    <label htmlFor="max-price-input">Max:</label>
                                                    <input
                                                        id="max-price-input"
                                                        type="number"
                                                        value={priceRange[1]}
                                                        onChange={handleMaxPriceInput}
                                                        min={priceRange[0]}
                                                        max={maxPossiblePrice}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="source-filter">
                            <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
                                <option value="all">All Sources</option>
                                <option value="Gametime">Gametime</option>
                                <option value="StubHub">StubHub</option>
                                <option value="TickPick">TickPick</option>
                            </select>
                        </div>
                        
                        <Button
                            onClick={handleClearFilters}
                            className='btns'
                            buttonStyle='btn--outline'
                            buttonSize='btn--medium'
                        >
                            Clear Filters
                        </Button>
                    </div>
    
                    {/* Seating Chart */}
                    <div className="seating-container">
                        <SeatingChart onSelectSection={setSelectedSection} stadiumFile={`/images/footprint-seating-chart.svg`} />
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



