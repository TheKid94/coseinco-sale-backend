const mongoose = require('mongoose');

const database = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// Conexión de la BD
mongoose.connect(database, {
    useNewUrlParser: true
}).then(con => {
    console.log('DB is connected');
});