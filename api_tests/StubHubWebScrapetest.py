from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# Path to Chrome for Testing (update with the actual path)
CHROME_BINARY_PATH = r"C:\Users\Owner\Downloads\chrome-win64\chrome-win64\chrome.exe"

# URL of the event you want to scrape
url = "https://www.stubhub.com/phoenix-suns-phoenix-tickets-10-26-2024/event/154770087/"

def scrape_tickets():
    # Set up Chrome options for Chrome for Testing
    chrome_options = Options()
    chrome_options.binary_location = CHROME_BINARY_PATH  # Path to Chrome for Testing
    chrome_options.add_argument("--headless")  # Optional: Run Chrome in headless mode
    chrome_options.add_argument('--disable-gpu')  # Disable GPU rendering
    chrome_options.add_argument('--ignore-certificate-errors')  # Ignore SSL errors
    chrome_options.add_argument('--disable-software-rasterizer')
    chrome_options.add_argument('--disable-webgl')
    chrome_options.add_argument('--disable-webgpu')
    chrome_options.add_argument("--no-sandbox")  # Bypass OS security model
    chrome_options.add_argument("--disable-dev-shm-usage")  # Overcome limited resource problems

    # Set up Chrome WebDriver with Chrome for Testing
    driver = webdriver.Chrome(service=Service(), options=chrome_options)

    # Open the event page
    driver.get(url)

    # Scroll the page to load more tickets
    last_height = driver.execute_script("return document.body.scrollHeight")
    
    while True:
        # Scroll down to the bottom
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        # Wait for new page height and content to load
        time.sleep(5)
        new_height = driver.execute_script("return document.body.scrollHeight")
        
        # Check if the height of the page has stopped changing (no more content to load)
        if new_height == last_height:
            break
        last_height = new_height

    # Wait for the page to fully load and elements to be present
    try:
        WebDriverWait(driver, 50).until(EC.presence_of_all_elements_located((By.CLASS_NAME, "sc-hlalgf-31")))  # Wait for rows
    except Exception as e:
        print(f"Loading error: {e}")

    # Locate ticket information
    try:
        ticket_rows = driver.find_elements(By.CLASS_NAME, "sc-hlalgf-31")  # Row class
        prices = driver.find_elements(By.CLASS_NAME, "sc-hlalgf-1")  # Price class
        sections = driver.find_elements(By.CLASS_NAME, "sc-hlalgf-0")  # Section class

        print("Raw Ticket Rows:")
        for row in ticket_rows:
            print(row.text)
        
        print("\nRaw Prices:")
        for price in prices:
            print(price.text)
        
        print("\nRaw Sections:")
        for section in sections:
            print(section.text)

        # Check for extracted data lengths
        print(f"\nLengths - Rows: {len(ticket_rows)}, Prices: {len(prices)}, Sections: {len(sections)}")

        # Define valid section ranges
        valid_sections = list(range(101, 125)) + list(range(201, 233))  # Lower level: 101-124, Upper level: 201-232

        # Assuming lengths match; adjust if they don't
        for i in range(min(len(prices), len(ticket_rows), len(sections))):  # Use min to prevent index out of range
            price_text = prices[i].text.strip()
            section_text = sections[i].text.strip()
            row_text = ticket_rows[i].text.strip()

            # Check if the section is valid and row number is valid
            if (section_text.isdigit() and int(section_text) in valid_sections) and row_text.startswith("Row"):
                row_number = int(row_text.split()[-1])  # Extract the row number from "Row X"
                if 1 <= row_number <= 28:  # Check if the row number is valid (1 to 28)
                    print(f"Section: {section_text}, Row: {row_text}, Price: {price_text}")

    except Exception as e:
        print(f"An error occurred: {e}")

    # Close the browser
    driver.quit()

# Run the function to scrape and output ticket data
scrape_tickets()
