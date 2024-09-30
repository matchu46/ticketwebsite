from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import time
from bs4 import BeautifulSoup

# Path to Chrome for Testing (update with the actual path)
CHROME_BINARY_PATH = r"C:\Users\Owner\Downloads\chrome-win64\chrome-win64\chrome.exe"

# URL of the event you want to scrape
url = "https://www.stubhub.com/phoenix-suns-phoenix-tickets-10-26-2024/event/154770087/"

def scrape_classes():
    # Set up Chrome options for Chrome for Testing
    chrome_options = Options()
    chrome_options.binary_location = CHROME_BINARY_PATH  # Path to Chrome for Testing
    chrome_options.add_argument("--headless")  # Optional: Run Chrome in headless mode
    chrome_options.add_argument('--disable-gpu')  # Disable GPU rendering
    chrome_options.add_argument('--ignore-certificate-errors')  # Ignore SSL errors
    chrome_options.add_argument("--no-sandbox")  # Bypass OS security model
    chrome_options.add_argument("--disable-dev-shm-usage")  # Overcome limited resource problems

    # Set up Chrome WebDriver with Chrome for Testing
    driver = webdriver.Chrome(service=Service(), options=chrome_options)

    try:
        # Open the event page
        driver.get(url)

        # Wait for the page to load completely
        time.sleep(5)  # Adjust this if necessary

        # Get the page source
        page_source = driver.page_source
        
        # Parse the page source with BeautifulSoup
        soup = BeautifulSoup(page_source, 'html.parser')

        # Set to store unique classes
        unique_classes = set()

        # Find all elements and extract their classes
        for element in soup.find_all(True):  # True finds all tags
            classes = element.get('class')
            if classes:
                unique_classes.update(classes)

        # Print the unique classes with descriptions
        print("Unique Classes Found on the Page:")
        for class_name in unique_classes:
            description = label_class(class_name)  # Get the description
            print(f"{class_name}: {description}")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Close the browser
        driver.quit()

def label_class(class_name):
    """Return a rough description of the class based on its name."""
    # Adjust labels based on your previous descriptions
    if "sc-hlalgf-0" in class_name:
        return "Section identifier"
    elif "sc-hlalgf-1" in class_name:
        return "Price display"
    elif "sc-hlalgf-31" in class_name:
        return "Row information"
    elif "Row" in class_name.lower().lower():
        return "Row information"
    elif "price" in class_name.lower():
        return "Price display"
    elif "Section" in class_name.lower():
        return "Section identifier"
    else:
        return "General element"

# Run the function to scrape classes
scrape_classes()
