const express = require('express');
const morgan = require('morgan');

// Inicializaciones
const app = express();

// Configuraciones
app.set('port', process.env.PORT || 3000);

// Middlewares
app.use(morgan('dev'));

// Variables globales

// Rutas

//Public

// Iniciando el servidor
app.listen(app.get('port'), () => {
    console.log(`Servidor en el puerto ${app.get('port')}`);
});
