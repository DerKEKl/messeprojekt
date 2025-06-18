const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const sensorRoutes = require('./routes/sensorRoutes');
const costsRoutes = require('./routes/costsRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const partsRoutes = require('./routes/partsRoutes');
const robotRoutes = require('./routes/robotRoutes')
const authRoutes = require('./routes/authRoutes')

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
app.use('/api/auth', authRoutes)

if (process.env.NODE_ENV === 'production') {
    console.log('Production mode - serving frontend');
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    app.get('*"."', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
}

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log('Server running on port: ' + PORT)
})