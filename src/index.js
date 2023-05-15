const express = require('express');
const morgan = require('morgan');
const {engine} = require('express-handlebars');
const path = require('path');

// Inicializaciones
const app = express();

// Configuraciones
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'), // src\views\layouts
    partialsDir: path.join(app.get('views'), 'partials'), // src\views\partials
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}));
app.set('view engine', '.hbs');

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

// Variables globales
app.use((req, res, next) => {
    next();
});

// Rutas
app.use(require('./routes/index.js'));
app.use(require('./routes/authentication'));
app.use('/links', require('./routes/links'));

//Public
app.use(express.static(path.join(__dirname, 'public')));

// Iniciando el servidor
app.listen(app.get('port'), () => {
    console.log(`Servidor en el puerto ${app.get('port')}`);
});
