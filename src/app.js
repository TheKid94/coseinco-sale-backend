const express = require('express');
const morgan = require('morgan');

// Error Handler
const globalErrHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

// Routes summon
const productoRoutes = require('./routes/ProductoRoutes');
const marcaRoutes = require('./routes/MarcaRoutes');


const app = express();
require('./database');



app.use(morgan('dev'));
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit: '50mb', parameterLimit: 100000, extended: true }));


//Routes - Cliente
app.use('/api/productos', productoRoutes);
app.use('/api/marcas', marcaRoutes);

//Routes - Admin

//Error in case there is no route
app.use('*', (req, res, next) => {
    const err = new AppError(404, 'fail', 'ruta no identificada');
    next(err, req, res, next);
});

app.use(globalErrHandler);

module.exports = app;