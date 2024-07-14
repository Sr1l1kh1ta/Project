const express = require('express');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// const Trip = require('./modules/tripModel');
const db = require('./db'); // Replace with your database connection path
// Define a generic model for the "February" collection without a predefined schema
const FebruaryTrip = mongoose.model('FebruaryTrip', new mongoose.Schema({}, { strict: false }), 'February');
const MarchTrip = mongoose.model('MarchTrip', new mongoose.Schema({}, { strict: false }), 'March');

const FebCleanedData = mongoose.model('FebCleanedData', new mongoose.Schema({}, { strict: false }), 'FebCleanedData');
const MarCleanedData = mongoose.model('MarCleanedData', new mongoose.Schema({}, { strict: false }), 'MarCleanedData');

const DEFAULT_WIDTH = 800; // Default width in px
const DEFAULT_HEIGHT = 300; // Default height in px

const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/trips/feb', async (req, res) => {
try {
  const trips = await FebruaryTrip.find().limit(10);
  res.render('febTrips', { trips });
} catch (err) {
  console.error(err);
  res.status(500).json({ message: 'Server Error' });
}
});

app.get('/trips/mar', async (req, res) => {
try {
  const trips = await MarchTrip.find().limit(10);
  res.render('marTrips', {  trips });
} catch (err) {
  console.error(err);
  res.status(500).json({ message: 'Server Error' });
}
});

app.get('/trips/feb/duration', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // Default to 10
  try {
    const trips = await FebruaryTrip.find().limit(limit);

    // Transform the data and filter columns
    const transformedTrips = trips.map(trip => ({
      _id: trip._id,
      VendorID: trip.VendorID,
      Pickup_datetime: trip.tpep_pickup_datetime,
      Dropoff_datetime: trip.tpep_dropoff_datetime,
      Trip_duration_milliseconds: new Date(trip.tpep_dropoff_datetime) - new Date(trip.tpep_pickup_datetime), // duration in milliseconds
    }));

    res.render('febDuration', { trips: transformedTrips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});


app.get('/trips/mar/duration', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // Default to 10
  try {
    const trips = await MarchTrip.find().limit(limit);

    // Transform the data and filter columns
    const transformedTrips = trips.map(trip => ({
      _id: trip._id,
      VendorID: trip.VendorID,
      Pickup_datetime: trip.tpep_pickup_datetime,
      Dropoff_datetime: trip.tpep_dropoff_datetime,
      Trip_duration_milliseconds: new Date(trip.tpep_dropoff_datetime) - new Date(trip.tpep_pickup_datetime), // duration in milliseconds
    }));

    res.render('marDuration', { trips: transformedTrips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});


app.get('/trips/feb/duration/vendor', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // Default to 10 if no limit is provided

  if (!req.query.limit) {
    // Render the form if no limit is provided
    res.send(`
      <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 8px 12px;
            border: 1px solid #ddd;
            text-align: center;
          }
          th {
            background-color: #f4f4f4;
          }
          form {
            margin-bottom: 20px;
          }
          input[type="number"] {
            padding: 8px;
            margin-right: 10px;
          }
          input[type="submit"] {
            padding: 8px 16px;
          }
        </style>
      </head>
      <body>
        <h1>Average Trip Duration by Vendor</h1>
        <form method="get" action="/trips/feb/duration/vendor">
          <label for="limit">Enter Limit: </label>
          <input type="number" id="limit" name="limit" min="1" required>
          <input type="submit" value="Submit">
        </form>
      </body>
      </html>
    `);
    return;
  }

  try {
    const trips = await FebruaryTrip.find().limit(limit);

    // Calculate the average trip duration and trip count for each vendor
    const vendorDurations = trips.reduce((acc, trip) => {
      const vendorId = trip.VendorID;
      const duration = new Date(trip.tpep_dropoff_datetime) - new Date(trip.tpep_pickup_datetime);

      if (!acc[vendorId]) {
        acc[vendorId] = { totalDuration: 0, tripCount: 0 };
      }
      acc[vendorId].totalDuration += duration;
      acc[vendorId].tripCount += 1;

      return acc;
    }, {});

    const averageDurations = Object.keys(vendorDurations).map(vendorId => ({
      vendorId,
      averageDuration: vendorDurations[vendorId].totalDuration / vendorDurations[vendorId].tripCount,
      tripCount: vendorDurations[vendorId].tripCount
    }));

    // Send the HTML response
    res.send(`
      <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 8px 12px;
            border: 1px solid #ddd;
            text-align: center;
          }
          th {
            background-color: #f4f4f4;
          }
          form {
            margin-bottom: 20px;
          }
          input[type="number"] {
            padding: 8px;
            margin-right: 10px;
          }
          input[type="submit"] {
            padding: 8px 16px;
          }
        </style>
      </head>
      <body>
        <h1>Average Trip Duration by Vendor</h1>
        <form method="get" action="/trips/feb/duration">
          <label for="limit">Enter Limit: </label>
          <input type="number" id="limit" name="limit" min="1" required>
          <input type="submit" value="Submit">
        </form>
        <table>
          <tr>
            <th>Vendor ID</th>
            <th>Average Duration (milliseconds)</th>
            <th>Number of Trips</th>
          </tr>
          ${averageDurations.map(vendor => `
            <tr>
              <td>${vendor.vendorId}</td>
              <td>${vendor.averageDuration.toFixed(2)}</td>
              <td>${vendor.tripCount}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching trip data.');
  }
});

app.get('/trips/mar/duration/vendor', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // Default to 10 if no limit is provided

  if (!req.query.limit) {
    // Render the form if no limit is provided
    res.send(`
      <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 8px 12px;
            border: 1px solid #ddd;
            text-align: center;
          }
          th {
            background-color: #f4f4f4;
          }
          form {
            margin-bottom: 20px;
          }
          input[type="number"] {
            padding: 8px;
            margin-right: 10px;
          }
          input[type="submit"] {
            padding: 8px 16px;
          }
        </style>
      </head>
      <body>
        <h1>Average Trip Duration by Vendor</h1>
        <form method="get" action="/trips/feb/duration/vendor">
          <label for="limit">Enter Limit: </label>
          <input type="number" id="limit" name="limit" min="1" required>
          <input type="submit" value="Submit">
        </form>
      </body>
      </html>
    `);
    return;
  }

  try {
    const trips = await MarchTrip.find().limit(limit);

    // Calculate the average trip duration and trip count for each vendor
    const vendorDurations = trips.reduce((acc, trip) => {
      const vendorId = trip.VendorID;
      const duration = new Date(trip.tpep_dropoff_datetime) - new Date(trip.tpep_pickup_datetime);

      if (!acc[vendorId]) {
        acc[vendorId] = { totalDuration: 0, tripCount: 0 };
      }
      acc[vendorId].totalDuration += duration;
      acc[vendorId].tripCount += 1;

      return acc;
    }, {});

    const averageDurations = Object.keys(vendorDurations).map(vendorId => ({
      vendorId,
      averageDuration: vendorDurations[vendorId].totalDuration / vendorDurations[vendorId].tripCount,
      tripCount: vendorDurations[vendorId].tripCount
    }));

    // Send the HTML response
    res.send(`
      <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 8px 12px;
            border: 1px solid #ddd;
            text-align: center;
          }
          th {
            background-color: #f4f4f4;
          }
          form {
            margin-bottom: 20px;
          }
          input[type="number"] {
            padding: 8px;
            margin-right: 10px;
          }
          input[type="submit"] {
            padding: 8px 16px;
          }
        </style>
      </head>
      <body>
        <h1>Average Trip Duration by Vendor</h1>
        <form method="get" action="/trips/mar/duration/vendor">
          <label for="limit">Enter Limit: </label>
          <input type="number" id="limit" name="limit" min="1" required>
          <input type="submit" value="Submit">
        </form>
        <table>
          <tr>
            <th>Vendor ID</th>
            <th>Average Duration (milliseconds)</th>
            <th>Number of Trips</th>
          </tr>
          ${averageDurations.map(vendor => `
            <tr>
              <td>${vendor.vendorId}</td>
              <td>${vendor.averageDuration.toFixed(2)}</td>
              <td>${vendor.tripCount}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching trip data.');
  }
});


app.get('/trips/feb/cleaned', async (req, res) => {
  try {
      const cleanedData = await FebCleanedData.find().limit(1000); // Limit to 1000 documents
      res.json(cleanedData);
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});

app.get('/trips/mar/cleaned', async (req, res) => {
  try {
      const cleanedData = await MarCleanedData.find().limit(1000); // Limit to 1000 documents
      res.json(cleanedData);
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});

app.get('/trips/mar/revenue', async (req, res) => {
  try {
    const revenueData = await MarchTrip.aggregate([
      {
        $group: {
          _id: { $hour: "$tpep_pickup_datetime" }, // Group by hour
          totalRevenue: { $sum: "$total_amount" }  // Sum up the total amount for each hour
        }
      },
      { $sort: { "_id": 1 } } // Sort by hour
    ]);

    const hours = revenueData.map(data => data._id);
    const revenue = revenueData.map(data => data.totalRevenue);

    const width = 800; // px
    const height = 300; // px
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const configuration = {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [{
          label: 'Total Revenue',
          data: revenue,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: 'Hour of the Day'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Total Revenue'
            },
            beginAtZero: true
          }
        }
      }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const imageBase64 = imageBuffer.toString('base64');

    res.render('hourlyrevenue', { imageBase64 }); // Ensure this name matches the EJS file
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/trips/feb/revenue', async (req, res) => {
  try {
    const revenueData = await FebruaryTrip.aggregate([
      {
        $group: {
          _id: { $hour: "$tpep_pickup_datetime" }, // Group by hour
          totalRevenue: { $sum: "$total_amount" }  // Sum up the total amount for each hour
        }
      },
      { $sort: { "_id": 1 } } // Sort by hour
    ]);

    const hours = revenueData.map(data => data._id);
    const revenue = revenueData.map(data => data.totalRevenue);

    const width = 800; // Default width in px
    const height = 300; // Default height in px
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const configuration = {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [{
          label: 'Total Revenue',
          data: revenue,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: 'Hour of the Day'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Total Revenue'
            },
            beginAtZero: true
          }
        }
      }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const imageBase64 = imageBuffer.toString('base64');

    res.render('hourlyrevenue', { imageBase64 }); // Ensure this name matches the EJS file
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/trips/mar/payment-types', async (req, res) => {
  try {
    const paymentTypeData = await MarchTrip.aggregate([
      {
        $group: {
          _id: { $toString: { $ifNull: ["$payment_type", "0"] } }, // Replace null with "0" and convert to string
          totalRevenue: { $sum: "$total_amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const paymentTypes = paymentTypeData.map(data => data._id);
    const revenues = paymentTypeData.map(data => data.totalRevenue);

    const width = 800; // Default width in px
    const height = 300; // Default height in px
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const configuration = {
      type: 'pie',
      data: {
        labels: paymentTypes,
        datasets: [{
          label: 'Total Revenue',
          data: revenues,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Revenue by Payment Type'
          }
        }
      }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const imageBase64 = imageBuffer.toString('base64');

    res.render('paymenttypes', { imageBase64 }); // Ensure this name matches the EJS file
  } catch (error) {
    console.error('Error fetching payment type data:', error);
    res.status(500).send('An error occurred while fetching payment type data.');
  }
});

app.get('/trips/feb/payment-types', async (req, res) => {
  try {
    const paymentTypeData = await FebruaryTrip.aggregate([
      {
        $group: {
          _id: { $toString: { $ifNull: ["$payment_type", "0"] } }, // Replace null with "0" and convert to string
          totalRevenue: { $sum: "$total_amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const paymentTypes = paymentTypeData.map(data => data._id);
    const revenues = paymentTypeData.map(data => data.totalRevenue);

    const width = 800; // Default width in px
    const height = 300; // Default height in px
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const configuration = {
      type: 'pie',
      data: {
        labels: paymentTypes,
        datasets: [{
          label: 'Total Revenue',
          data: revenues,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Revenue by Payment Type'
          }
        }
      }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const imageBase64 = imageBuffer.toString('base64');

    res.render('paymenttypes', { imageBase64 }); // Ensure this name matches the EJS file
  } catch (error) {
    console.error('Error fetching payment type data:', error);
    res.status(500).send('An error occurred while fetching payment type data.');
  }
});

app.get('/trips/mar/distance-analysis', async (req, res) => {
  try {
    // Get chart dimensions from query parameters, with default values
    const chartWidth = parseInt(req.query.width, 10) || DEFAULT_WIDTH;
    const chartHeight = parseInt(req.query.height, 10) || DEFAULT_HEIGHT;

    // Initialize ChartJSNodeCanvas with the provided dimensions
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: chartWidth, height: chartHeight });

    // Limit to 10,000 records to manage memory usage
    const maxRecords = 10000;

    // Fetch distances with a limit to handle memory usage
    const distances = await MarchTrip.find().limit(maxRecords).select('trip_distance -_id').lean();
    const distanceValues = distances.map(d => d.trip_distance);

    // Define distance ranges (bins)
    const bins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Customize these ranges as needed
    const binLabels = bins.slice(0, -1).map((_, i) => `${bins[i]}-${bins[i + 1]} miles`);

    // Count trips in each bin
    const counts = bins.slice(1).map((upper, i) => {
      const lower = bins[i];
      return distanceValues.filter(d => d >= lower && d < upper).length;
    });

    // Chart configuration
    const configuration = {
      type: 'bar',
      data: {
        labels: binLabels,
        datasets: [{
          label: 'Number of Trips',
          data: counts,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: 'Distance Ranges (miles)' },
            ticks: { autoSkip: false }
          },
          y: {
            title: { display: true, text: 'Number of Trips' },
            beginAtZero: true
          }
        }
      }
    };

    // Generate the chart image
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const imageBase64 = imageBuffer.toString('base64');

    // Render the EJS template with the chart image
    res.render('distanceanalysis', { imageBase64 });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).send('An error occurred while fetching trip distance data.');
  }
});

app.get('/trips/feb/distance-analysis', async (req, res) => {
  try {
    // Get chart dimensions from query parameters, with default values
    const chartWidth = parseInt(req.query.width, 10) || DEFAULT_WIDTH;
    const chartHeight = parseInt(req.query.height, 10) || DEFAULT_HEIGHT;

    // Initialize ChartJSNodeCanvas with the provided dimensions
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: chartWidth, height: chartHeight });

    // Limit to 10,000 records to manage memory usage
    const maxRecords = 10000;

    // Fetch distances with a limit to handle memory usage
    const distances = await FebruaryTrip.find().limit(maxRecords).select('trip_distance -_id').lean();
    const distanceValues = distances.map(d => d.trip_distance);

    // Define distance ranges (bins)
    const bins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Customize these ranges as needed
    const binLabels = bins.slice(0, -1).map((_, i) => `${bins[i]}-${bins[i + 1]} miles`);

    // Count trips in each bin
    const counts = bins.slice(1).map((upper, i) => {
      const lower = bins[i];
      return distanceValues.filter(d => d >= lower && d < upper).length;
    });

    // Chart configuration
    const configuration = {
      type: 'bar',
      data: {
        labels: binLabels,
        datasets: [{
          label: 'Number of Trips',
          data: counts,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: 'Distance Ranges (miles)' },
            ticks: { autoSkip: false }
          },
          y: {
            title: { display: true, text: 'Number of Trips' },
            beginAtZero: true
          }
        }
      }
    };

    // Generate the chart image
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const imageBase64 = imageBuffer.toString('base64');

    // Render the EJS template with the chart image
    res.render('distanceanalysis', { imageBase64 });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).send('An error occurred while fetching trip distance data.');
  }
});


app.get('/trips/feb/hourly', async (req, res) => {
  try {
    const trips = await FebruaryTrip.aggregate([
      {
          $group: {
              _id: { $hour: "$tpep_pickup_datetime" }, // Extract hour from the datetime
              count: { $sum: 1 } // Count the number of trips for each hour
          }
      },
      { $sort: { "_id": 1 } } // Sort by hour
      ]);
  

      const hours = trips.map(trip => trip._id);
      const counts = trips.map(trip => trip.count);

      const width = 800; //px
      const height = 600; //px
      const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

      const configuration = {
          type: 'bar',
          data: {
              labels: hours,
              datasets: [{
                  label: 'Number of Trips',
                  data: counts,
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
              }]
          },
          options: {
              scales: {
                  x: {
                      title: {
                          display: true,
                          text: 'Hour of the Day'
                      }
                  },
                  y: {
                      title: {
                          display: true,
                          text: 'Number of Trips'
                      },
                      beginAtZero: true
                  }
              }
          }
      };

      const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
      const imageBase64 = imageBuffer.toString('base64');

      res.render('hourlytrips', { trips, imageBase64 }); // Render the EJS template

  } catch (error) {
      res.status(500).send(error);
  }
});


app.get('/trips/mar/hourly', async (req, res) => {
  try {
    const trips = await MarchTrip.aggregate([
      {
          $group: {
              _id: { $hour: "$tpep_pickup_datetime" }, // Extract hour from the datetime
              count: { $sum: 1 } // Count the number of trips for each hour
          }
      },
      { $sort: { "_id": 1 } } // Sort by hour
      ]);
  

      const hours = trips.map(trip => trip._id);
      const counts = trips.map(trip => trip.count);

      const width = 800; //px
      const height = 600; //px
      const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

      const configuration = {
          type: 'bar',
          data: {
              labels: hours,
              datasets: [{
                  label: 'Number of Trips',
                  data: counts,
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
              }]
          },
          options: {
              scales: {
                  x: {
                      title: {
                          display: true,
                          text: 'Hour of the Day'
                      }
                  },
                  y: {
                      title: {
                          display: true,
                          text: 'Number of Trips'
                      },
                      beginAtZero: true
                  }
              }
          }
      };

      const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
      const imageBase64 = imageBuffer.toString('base64');

      res.render('hourlytrips', { trips, imageBase64 }); // Render the EJS template

  } catch (error) {
      res.status(500).send(error);
  }
});


app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.path)
  }
})


// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});