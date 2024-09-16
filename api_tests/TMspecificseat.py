#'GuyRlAxUEWU4zQmAoM12n9Jgsu7JZxGw'
import requests
from datetime import datetime, timedelta

# Your Ticketmaster API key
api_key = 'GuyRlAxUEWU4zQmAoM12n9Jgsu7JZxGw'

# Function to search for D-backs games on a specific date
def search_dbacks_games_on_date(api_key, date):
    url = 'https://app.ticketmaster.com/discovery/v2/events.json'

    try:
        # Convert the date input to datetime object
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        start_date = date_obj.replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + "Z"
        end_date = (date_obj + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + "Z"
    except ValueError:
        print("Invalid date format. Please enter date in YYYY-MM-DD format.")
        return None

    print(f"Searching for events from {start_date} to {end_date}")

    # Parameters for the search
    params = {
        'apikey': api_key,
        'keyword': 'Arizona Diamondbacks',  # Search keyword for the team
        'city': 'Phoenix',  # City where they usually play
        'countryCode': 'US',  # Only events in the US
        'classificationName': 'Sports',  # Only return sports events
        'startDateTime': start_date,  # Specific start date and time
        'endDateTime': end_date  # Specific end date and time
    }

    # Make the request to search for D-backs games
    response = requests.get(url, params=params)

    if response.status_code == 200:
        event_data = response.json()

        # Extract event information
        if '_embedded' in event_data and 'events' in event_data['_embedded']:
            print("Found D-backs games on that date:\n")
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
            print(f"No D-backs games found on {date}.")
            return None
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None


# Function to get price ranges for a specific game by event ID
def get_ticket_price_ranges(api_key, event_id):
    event_url = f'https://app.ticketmaster.com/discovery/v2/events/{event_id}.json'

    # Parameters for the request
    params = {
        'apikey': api_key
    }

    # Make the request to get event details
    response = requests.get(event_url, params=params)

    if response.status_code == 200:
        event_details = response.json()

        # Extract price range information
        if 'priceRanges' in event_details:
            price_ranges = event_details['priceRanges']
            sorted_prices = sorted(price_ranges, key=lambda x: x['min'])

            print(f"\nPrice ranges for event {event_id}:\n")
            for idx, price in enumerate(sorted_prices[:20]):
                price_min = price['min']
                price_max = price['max']
                print(f"Price Range {idx + 1}: ${price_min} - ${price_max}")
                print("-------")
        else:
            print("No price range information available for this event.")
    else:
        print(f"Error: {response.status_code} - {response.text}")


# Main function to search for a game on 2024-09-28 and show the ticket price ranges
def main():
    # Fixed date for search
    fixed_date = '2024-09-28'

    print(f"\nSearching for Arizona Diamondbacks games on {fixed_date}...\n")

    # Step 1: Search for D-backs games on the specified date
    events = search_dbacks_games_on_date(api_key, fixed_date)

    # Step 2: If any events are found, pick the first one and get the price ranges
    if events:
        first_event_id = events[0]['id']  # Use the first event's ID for ticket details
        print("\nFetching ticket price ranges for the first event...\n")
        get_ticket_price_ranges(api_key, first_event_id)

if __name__ == "__main__":
    main()
