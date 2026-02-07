from data_collector import *
import bot
import time, json
from wallet_env import wallet_env

if __name__ == "__main__":
    wallet_env=wallet_env(1000)  # Initialize wallet with an initial value of 1000
    print(f"Current wallet value: {wallet_env.get_value()}")

    data = collect_data(limit=500)  # Collect market and news data
    sorted_data = sort_data(data["market_data"])  # Print the collected news data
   
    for event_data in sorted_data:
        print_analyzed_event(
            event_data, 
            show_description=True,
            compact=False
        )

    print(f'Length of market data: {len(data["market_data"])}')  # Print the length of the collected market data

    print(bot.analyze_event_locally(f'{sorted_data} print the markets/events who are concerned about politics/russia'))  # Test the bot's response to a simple query
