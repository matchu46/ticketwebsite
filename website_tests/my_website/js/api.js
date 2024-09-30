const apiUrl = 'https://api.ticketwebsite.com/v1/tickets';
const apiKey = 'your_api_key_here';

// Function to fetch ticket data from the API
async function fetchFromAPI(query) {
    const response = await fetch(`${apiUrl}?search=${query}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch ticket data');
    }

    const data = await response.json();
    return data.tickets; // Assuming the API returns an array of tickets
}
