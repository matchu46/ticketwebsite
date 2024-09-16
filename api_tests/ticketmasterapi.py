import requests

# Your Ticketmaster API key
api_key = 	'GuyRlAxUEWU4zQmAoM12n9Jgsu7JZxGw'

# Function to search for D-backs games
def search_dbacks_games(api_key):
    url = 'https://app.ticketmaster.com/discovery/v2/events.json'

    # Parameters for the search
    params = {
        'apikey': api_key,
        'keyword': 'Arizona Diamondbacks',  # Search keyword for the team
        'city': 'Phoenix',  # City where they usually play
        'countryCode': 'US',  # Only events in the US
        'classificationName': 'Sports',  # Only return sports events
    }

    # Make the request to search for D-backs games
    response = requests.get(url, params=params)

    if response.status_code == 200:
        event_data = response.json()

        # Extract event information
        if '_embedded' in event_data and 'events' in event_data['_embedded']:
            print("Found D-backs games:\n")
            for event in event_data['_embedded']['events']:
                event_name = event['name']
                event_date = event['dates']['start']['localDate']
                venue_name = event['_embedded']['venues'][0]['name']
                event_id = event['id']
                print(f"Event: {event_name}")
                print(f"Date: {event_date}")
                print(f"Venue: {venue_name}")
                print(f"Event ID: {event_id}")
                print("-------")
            return event_data['_embedded']['events']  # Return list of events
        else:
            print("No D-backs games found.")
            return None
    else:
        print(f"Error: {response.status_code}")
        return None


# Function to get event details for a specific game by event ID
def get_event_details(api_key, event_id):
    event_url = f'https://app.ticketmaster.com/discovery/v2/events/{event_id}.json'

    # Parameters for the request
    params = {
        'apikey': api_key
    }

    # Make the request to get event details
    response = requests.get(event_url, params=params)

    if response.status_code == 200:
        event_details = response.json()

        # Extract and print event details
        event_name = event_details.get('name')
        event_date = event_details['dates']['start'].get('localDate')
        venue_name = event_details['_embedded']['venues'][0].get('name')
        venue_address = event_details['_embedded']['venues'][0]['address'].get('line1')
        ticket_prices = event_details.get('priceRanges', [{'min': 'N/A', 'max': 'N/A'}])

        print(f"Event Name: {event_name}")
        print(f"Date: {event_date}")
        print(f"Venue: {venue_name}")
        print(f"Address: {venue_address}")
        print(f"Ticket Price Range: ${ticket_prices[0]['min']} - ${ticket_prices[0]['max']}")
    else:
        print(f"Error: {response.status_code}")


# Main function to search and then display details for a specific D-backs game
def main():
    print("Searching for Arizona Diamondbacks games...\n")

    # Step 1: Search for D-backs games
    events = search_dbacks_games(api_key)

    # Step 2: If any events are found, pick the first one and get its details
    if events:
        first_event_id = events[0]['id']  # Use the first event's ID for details
        print("\nFetching details for the first event...\n")
        get_event_details(api_key, first_event_id)

if __name__ == "__main__":
    main()
