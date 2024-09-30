
document.getElementById('searchButton').addEventListener('click', function() {
    const query = document.getElementById('eventSearch').value;
    
    if (query) {
        fetchTicketPrices(query);
    }
});

// This is a placeholder function for calling your API
async function fetchTicketPrices(query) {
    try {
        const data = await fetchFromAPI(query); // Call the API with a query
        displayTicketData(data);                // Display the result
    } catch (error) {
        console.error('Error fetching ticket prices:', error);
    }
}

// Display ticket data on the page
function displayTicketData(data) {
    const ticketContainer = document.getElementById('ticketContainer');
    ticketContainer.innerHTML = '';

    data.forEach(ticket => {
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket';

        ticketElement.innerHTML = `
            <h3>${ticket.eventName}</h3>
            <p>Date: ${ticket.date}</p>
            <p>Venue: ${ticket.venue}</p>
            <p>Price: $${ticket.price}</p>
        `;

        ticketContainer.appendChild(ticketElement);
    });
}
