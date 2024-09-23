import requests
from bs4 import BeautifulSoup

# Define the URL for SeatGeek sports events
url = 'https://seatgeek.com/sports-tickets'

# Make a request to the SeatGeek page
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    # Parse the page content
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find the event listings
    events = soup.find_all('div', class_='event-card')

    for event in events:
        # Scrape event title
        title = event.find('h3', class_='event-title').text.strip()
        
        # Scrape event date
        date = event.find('time').get('datetime')
        
        # Scrape event venue
        venue = event.find('div', class_='venue-name').text.strip()
        
        # Print the scraped data
        print(f'Event: {title}')
        print(f'Date: {date}')
        print(f'Venue: {venue}')
        print('---')
else:
    print('Failed to retrieve the webpage.')
