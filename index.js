const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config()
const sensorRoutes = require('./routes/sensorRoutes');
const costsRoutes = require('./routes/costsRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const partsRoutes = require('./routes/partsRoutes');
const robotRoutes = require('./routes/robotRoutes')

mongoose.connect(process.env.MONGO_DB_URL, {
}).then(response => {
    console.log('MongoDB Connection Succeeded.')
}).catch(error => {
    console.log('Error in DB connection: ' + error)
});

app.use(express.json())

app.use('/api/sensor', sensorRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/robot', robotRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log('Server running on port: ' + PORT)
})