const express = require('express');
const morgan = require('morgan');
const {
    engine
} = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const {
    database
} = require('./keys');
const passport = require('passport');

// Inicializaciones
const app = express();
require('./lib/passport');

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
app.use(session({
    secret: 'geowessnodesession',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database),
}));
app.use(morgan('dev'));
app.use(express.urlencoded({
    extended: false
}));
app.use(express.json());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Variables globales
app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    app.locals.user = req.user;
    next();
});

// Rutas
app.use(require('./routes/index'));
app.use(require('./routes/authentication'));
app.use('/usuario', require('./routes/usuario'));
// app.use('/proyectos', require('./routes/proyecto'));
app.use('/proyectos', require('./routes/projects'));

//Public
app.use(express.static(path.join(__dirname, 'public')));

// Iniciando el servidor
app.listen(app.get('port'), () => {
    console.log(`Servidor en el puerto ${app.get('port')}`);
});