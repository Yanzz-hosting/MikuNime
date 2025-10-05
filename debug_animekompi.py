import requests
from bs4 import BeautifulSoup

URL = "https://v1.animekompi.fun/"

try:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    # Added verify=False to bypass SSL certificate verification error
    page = requests.get(URL, headers=headers, timeout=10, verify=False)
    page.raise_for_status()
    soup = BeautifulSoup(page.content, "html.parser")

    # Let's find the main container for the latest episode releases
    latest_releases_container = soup.find('div', class_='kgries')

    if latest_releases_container:
        print("Found latest releases container with class 'kgries'. Printing its content:")
        print(latest_releases_container.prettify())
    else:
        print("Could not find container with class 'kgries'. Printing the whole body to inspect:")
        print(soup.body.prettify())

except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")