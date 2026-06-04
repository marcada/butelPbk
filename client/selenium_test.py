from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

try:
    driver = webdriver.Chrome(options=options)
    driver.get('http://bilbordi.damarcian.com/')
    time.sleep(5)
    
    print("=== CONSOLE LOGS ===")
    logs = driver.get_log('browser')
    if not logs:
        print("No console logs found.")
    for entry in logs:
        print(entry)
        
    driver.quit()
except Exception as e:
    print("Error:", e)
