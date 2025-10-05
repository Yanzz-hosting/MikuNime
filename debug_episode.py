
import requests
from bs4 import BeautifulSoup

# Example URL from an episode list
URL = "https://kuronime.moe/nonton-boruto-naruto-next-generations-episode-293/"

try:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    page = requests.get(URL, headers=headers, timeout=15)
    page.raise_for_status()
    soup = BeautifulSoup(page.content, "html.parser")

    # Streaming links are often in a specific div, possibly with an id like 'player' or class 'player-embed'
    # Let's look for a div with download links first, as it's usually more straightforward.
    download_container = soup.find('div', class_='download')

    if download_container:
        print("Found download links container. Printing its content:")
        print(download_container.prettify())
    else:
        print("Could not find download links container. Printing the whole body to inspect for video players or other clues:")
        print(soup.body.prettify())

except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")
