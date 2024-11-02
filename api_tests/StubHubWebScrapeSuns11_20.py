from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from collections import OrderedDict
import os
import logging
import time

# Set up logging
logging.basicConfig(level=logging.INFO)

# Path to Chrome for Testing (update with the actual path)
CHROME_BINARY_PATH = r"C:\Users\Owner\Downloads\chrome-win64\chrome-win64\chrome.exe"

# URL of the event you want to scrape
url = "https://www.stubhub.com/phoenix-suns-phoenix-tickets-11-20-2024/event/154770080/?qid=24e3298a63bcfbd58f65bcd783136755&index=stubhub&ut=0f02c2f5fa9a11994a37229ffb5950bb36ccaab3&quantity=2"

# Define valid section ranges
VALID_SECTIONS = list(range(101, 125)) + list(range(201, 233))
VALID_ROW_RANGE = range(1, 29)  # Rows from 1 to 28

def scrape_tickets():
    chrome_options = Options()
    chrome_options.binary_location = CHROME_BINARY_PATH
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-software-rasterizer")
    chrome_options.add_argument('--ignore-certificate-errors')
    chrome_options.add_argument("--allow-insecure-localhost")
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    # Set up Chrome WebDriver
    driver = webdriver.Chrome(service=Service(), options=chrome_options)

    try:
        driver.get(url)

        # Allow time for the page to load
        time.sleep(5)  # Wait for initial content to load

        collected_tickets = OrderedDict()  # To store unique ticket data with order
        previous_ticket_count = 0  # To keep track of the number of tickets found

        while True:
            try:
                # Use explicit wait for ticket elements to load
                WebDriverWait(driver, 20).until(
                    EC.presence_of_all_elements_located((By.CLASS_NAME, "sc-hlalgf-26"))
                )

                # Re-fetch elements to avoid stale references
                ticket_rows = driver.find_elements(By.CLASS_NAME, "sc-hlalgf-26")
                prices = driver.find_elements(By.CLASS_NAME, "sc-hlalgf-1")
                sections = driver.find_elements(By.CLASS_NAME, "sc-hlalgf-0")

                # Log the number of elements found
                logging.info(f"Found {len(ticket_rows)} ticket rows, {len(prices)} prices, {len(sections)} sections.")

                # Extract and process ticket data
                for i in range(min(len(prices), len(ticket_rows), len(sections))):
                    try:
                        ticket_info = extract_ticket_data(ticket_rows[i], prices[i], sections[i])
                        if ticket_info:
                            section, row, price = ticket_info
                            if (section, row) not in collected_tickets:
                                collected_tickets[(section, row)] = price
                                logging.info(f"Valid Ticket - Section: {section}, Row: {row}, Price: {price}")

                    except Exception as e:
                        logging.error(f"Error processing ticket {i}: {e}")

                # Write tickets to file after processing
                save_tickets_to_file(collected_tickets, "ticket_info_11_20.txt")

                # Scroll down to load more tickets if new tickets might be available
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(3)  # Wait a few seconds for more tickets to load

                # Check if new tickets were loaded
                new_ticket_count = len(ticket_rows)
                if new_ticket_count == previous_ticket_count:
                    logging.info("No new tickets found. Stopping the scrape.")
                    break
                previous_ticket_count = new_ticket_count

            except Exception as e:
                logging.error(f"An error occurred during scraping: {e}")
                break

    except Exception as e:
        logging.error(f"An error occurred while setting up the driver: {e}")
    finally:
        driver.quit()

def extract_ticket_data(ticket_row, price_element, section_element):
    price_text = price_element.text.strip()
    section_text = section_element.text.strip()
    row_text = ticket_row.text.strip()

    # Clean the data
    cleaned_section = clean_section(section_text)
    cleaned_row = clean_row(row_text)

    if is_valid_ticket(cleaned_section, cleaned_row):
        cleaned_price = f"${price_text.replace('$', '').strip()}"
        return cleaned_section, cleaned_row, cleaned_price
    return None

def clean_section(section_text):
    return section_text.split("Section")[-1].strip() if "Section" in section_text else section_text.strip()

def clean_row(row_text):
    return row_text.split("Row")[-1].strip() if "Row" in row_text else row_text.strip()

def is_valid_ticket(section, row):
    return section.isdigit() and int(section) in VALID_SECTIONS and row.isdigit() and int(row) in VALID_ROW_RANGE

def save_tickets_to_file(tickets, filename):
    # Write tickets to file, overwriting previous content
    with open(filename, 'w') as file:
        for (section, row), price in tickets.items():
            file.write(f"Section: {section}, Row: {row}, Price: {price}\n")
    logging.info(f"Tickets have been saved to {filename}.")

# Run the function to scrape and output ticket data
scrape_tickets()

