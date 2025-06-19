const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userModel');
require('dotenv').config({ path: path.join(__dirname, '.env') })

async function createUser() {
	await mongoose.connect(rocess.env.MONGO_DB_URL);
	const username = 'admin';
    const password = '123456';

    const existing = await User.findOne({ username });
    if (existing) {
        console.log('Benutzer existiert bereits');
        return;
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = new User({
        username,
        passwordHash: hash
    });

    await newUser.save();
    console.log('Benutzer gespeichert:', newUser);

    mongoose.disconnect();
}

createUser();

