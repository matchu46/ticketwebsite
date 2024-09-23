from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from bs4 import BeautifulSoup
import time

# Path to your ChromeDriver (ensure it matches your Chrome version)
chrome_driver_path = 'C:/path/to/chromedriver.exe'  # Replace with the correct path

# Set up the WebDriver using the Service class
driver = webdriver.Chrome()

# Load the SeatGeek sports tickets page
url = 'https://seatgeek.com/phoenix-suns-tickets/10-11-2024-phoenix-arizona-footprint-center/nba/17056370'
driver.get(url)

# Allow time for the page to load completely
time.sleep(5)  # Increase this if necessary

# Get the page source after the page has fully loaded
soup = BeautifulSoup(driver.page_source, 'html.parser')

# Find event listings on the page (adapt the selector to match actual HTML structure)
events = soup.find_all('div', class_='event-card')  # Adjust the class name based on the page's structure

# Loop through the events and extract information
for event in events:
    # Extract event title
    title = event.find('h3', class_='event-title').text.strip()

    # Extract event date
    date = event.find('time').get('datetime')

    # Extract event venue
    venue = event.find('div', class_='venue-name').text.strip()

    # Print event details
    print(f'Event: {title}')
    print(f'Date: {date}')
    print(f'Venue: {venue}')
    print('---')

# Close the browser once done
driver.quit()
