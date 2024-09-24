import requests
from bs4 import BeautifulSoup

# URL of the Suns game on StubHub
url = "https://www.stubhub.com/phoenix-suns-phoenix-tickets-10-26-2024/event/154770087/"

def scrape_tickets():
    # Send a GET request to the URL
    response = requests.get(url)
    
    # Check if the request was successful
    if response.status_code != 200:
        print(f"Failed to retrieve page with status code: {response.status_code}")
        return
    
    # Parse the HTML content
    soup = BeautifulSoup(response.content, 'html.parser')

    # Debug: Print out the parsed HTML to see the structure
    # print(soup.prettify())  # Uncomment this line to see the HTML structure

    # Extract ticket information directly using more generic selectors
    tickets = []
    
    # Example selector for ticket elements (this may need adjustment)
    ticket_rows = soup.find_all('div', class_='sc-1b4mh9n-0')  # Update based on actual class name for ticket rows

    for row in ticket_rows:
        # Extract section, row, and price (update selectors as needed)
        section = row.find('div', class_='sc-hlalgf-0').text.strip() if row.find('div', class_='sc-hlalgf-0') else "N/A"
        seat_row = row.find('div', class_='sc-hlalgf-32').text.strip() if row.find('div', class_='sc-hlalgf-32') else "N/A"
        price = row.find('div', class_='sc-hlalgf-0').text.strip() if row.find('div', class_='sc-hlalgf-0') else "N/A"
        print("is this working")
        tickets.append({'Section': section, 'Row': seat_row, 'Price': price})

    # Output ticket information to terminal
    for ticket in tickets:
        print(f"Section: {ticket['Section']}, Row: {ticket['Row']}, Price: {ticket['Price']}")

# Run the function to scrape and output ticket data
scrape_tickets()
