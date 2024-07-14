import pandas as pd
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['TripRecords']
t_collection = db['FebCleanedData']
s_collection = db['February']

# Function to process data for a given month
def process_month(s_collection, t_collection):
    # Retrieve the data
    data = list(s_collection.find())
    df = pd.DataFrame(data)
    
    print(f"Retrieved {len(data)} documents from {s_collection.name}.")
    
    # Fill missing values with a default value (e.g., 0 for numeric columns, empty string for text columns)
    df.fillna({
        'fare_amount': 0,
        'tip_amount': 0,
        # Add other columns as needed
    }, inplace=True)
    
    # Convert date columns to datetime
    df['tpep_pickup_datetime'] = pd.to_datetime(df['tpep_pickup_datetime'], errors='coerce')
    df['tpep_dropoff_datetime'] = pd.to_datetime(df['tpep_dropoff_datetime'], errors='coerce')
    
    # Example transformation: Calculate total fare including tip
    df['total_fare'] = df['fare_amount'] + df['tip_amount']
    
    # Prepare the transformed DataFrame for insertion
    transformed_data = df.to_dict(orient='records')
    
    if transformed_data:
        t_collection.insert_many(transformed_data)
        print(f"Inserted {len(transformed_data)} documents into {t_collection.name}.")
    else:
        print("No transformed data to insert.")

# Process February
process_month(s_collection, t_collection)

# Process March
t_collection = db['MarCleanedData']
s_collection = db['March']
process_month(s_collection, t_collection)
