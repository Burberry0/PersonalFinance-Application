# update_prices.py
from connect_db import connect
from server import update_all_prices  # Assuming main.py has update_all_stock_prices

def run_price_update():
    db = next(connect())
    update_all_prices(db)
    db.close()

if __name__ == "__main__":
    run_price_update()
