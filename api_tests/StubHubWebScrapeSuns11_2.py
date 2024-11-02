from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
from selenium.common.exceptions import StaleElementReferenceException, NoSuchElementException

# Path to Chrome for Testing (update with the actual path)
CHROME_BINARY_PATH = r"C:\Users\Owner\Downloads\chrome-win64\chrome-win64\chrome.exe"

# URL of the event you want to scrape
url = "https://www.stubhub.com/phoenix-suns-phoenix-tickets-11-2-2024/event/154770099/?qid=24e3298a63bcfbd58f65bcd783136755&index=stubhub&ut=0f02c2f5fa9a11994a37229ffb5950bb36ccaab3&quantity=2"

def scrape_tickets():
    # Set up Chrome options for Chrome for Testing
    chrome_options = Options()
    chrome_options.binary_location = CHROME_BINARY_PATH
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-software-rasterizer")
    chrome_options.add_argument('--ignore-certificate-errors')
    chrome_options.add_argument("--allow-insecure-localhost")
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    # Set up Chrome WebDriver with Chrome for Testing
    driver = webdriver.Chrome(service=Service(), options=chrome_options)

    try:
        # Open the event page
        driver.get(url)

        # Wait for manual interaction
        input("Press Enter after clicking the seat selection button and scrolling to load tickets...")

        # Define valid section ranges
        valid_sections = list(range(101, 125)) + list(range(201, 233))
        collected_tickets = set()  # To store unique ticket data

        # Start scraping
        while True:
            # Check if the browser is still open
            if driver.window_handles:
                try:
                    # Wait for new elements to load
                    time.sleep(2)

                    # Re-fetch elements to avoid stale references
                    ticket_rows = driver.find_elements(By.CLASS_NAME, "sc-hlalgf-31")
                    prices = driver.find_elements(By.CLASS_NAME, "sc-hlalgf-1")
                    sections = driver.find_elements(By.CLASS_NAME, "sc-hlalgf-0")

                    # Print the lengths of the lists for debugging
                    print(f"Found {len(ticket_rows)} ticket rows, {len(prices)} prices, {len(sections)} sections.")

                    # Extract and print valid ticket data
                    for i in range(min(len(prices), len(ticket_rows), len(sections))):
                        try:
                            price_text = prices[i].text.strip()
                            section_text = sections[i].text.strip()
                            row_text = ticket_rows[i].text.strip()

                            # Debug print for each ticket
                            print(f"Raw data - Section: {section_text}, Row: {row_text}, Price: {price_text}")

                            # Clean the data
                            # Get section number, accounting for potential text variations
                            if "Section" in section_text:
                                cleaned_section = section_text.split("Section")[-1].strip()  # Extract number after 'Section'
                            else:
                                cleaned_section = section_text.strip()  # Use the raw section if not prefixed

                            # Get row number, accounting for potential text variations
                            if "Row" in row_text:
                                cleaned_row = row_text.split("Row")[-1].strip()  # Extract number after 'Row'
                            else:
                                cleaned_row = row_text.strip()  # Use the raw row if not prefixed

                            # Validate section and row
                            if cleaned_section.isdigit() and int(cleaned_section) in valid_sections and cleaned_row.isdigit() and 1 <= int(cleaned_row) <= 28:
                                cleaned_price = f"${price_text.replace('$', '').strip()}"  # Clean price

                                ticket_info = (cleaned_section, cleaned_row, cleaned_price)

                                # Avoid duplicates
                                if ticket_info not in collected_tickets:
                                    collected_tickets.add(ticket_info)
                                    print(f"Valid Ticket - Section: {cleaned_section}, Row: {cleaned_row}, Price: {cleaned_price}")

                                    # Write valid data to file
                                    with open("ticket_info.txt", "a") as file:
                                        file.write(f"Section: {cleaned_section}, Row: {cleaned_row}, Price: {cleaned_price}\n")
                            else:
                                print("Ticket did not match valid criteria.")

                        except StaleElementReferenceException:
                            print("Encountered stale element, retrying...")

                except StaleElementReferenceException:
                    print("Encountered stale element, retrying...")

                except NoSuchElementException as e:
                    print(f"No such element error: {e}")
            else:
                break

            print("No new tickets found.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        driver.quit()  # Close the browser

# Run the function to scrape and output ticket data
scrape_tickets()
