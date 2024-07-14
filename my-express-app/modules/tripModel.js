const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
// Define the schema for the Trip collection
const tripSchema = new Schema({
    _id: Schema.Types.ObjectId,
    VendorID: Number,
    tpep_pickup_datetime: Date,
    tpep_dropoff_datetime: Date,
    passenger_count: Number,
    trip_distance: Number,
    RatecodeID: Number,
    store_and_fwd_flag: String,
    PULocationID: Number,
    DOLocationID: Number,
    payment_type: Number,
    fare_amount: Number,
    extra: Number,
    mta_tax: Number,
    tip_amount: Number,
    tolls_amount: Number,
    improvement_surcharge: Number,
    total_amount: Number,
    congestion_surcharge: Number,
    airport_fee: { type: Number, default: null } // Assuming airport_fee can be null
});
 
// Create a model for the Trip collection

const Trip= mongoose.model('tripModel', tripSchema);
module.exports = Trip