const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('../lib/helpers');

passport.use('local.signin', new localStrategy({
    usernameField: 'correo_login',
    passwordField: 'pass_login',
    passReqToCallback: true
}, async (req, correo_login, pass_login, done) => {
    const rows = await pool.query('SELECT * FROM USUARIO WHERE us_Email = ?', [correo_login]);
    if (rows.length > 0) {
        const user = rows[0];
        const validPassword = await helpers.matchPassword(pass_login, user.us_Password);
        if (validPassword) {
            done(null, user, req.flash('success', 'Bienvenido ' + user.us_Email));
        } else {
            done(null, false, req.flash('message', 'Contraseña incorrecta'));
        }
    } else {
        return done(null, false, req.flash('message', 'El usuario no existe'));
    }
}));

passport.use('local.signup', new localStrategy({
    usernameField: 'correo_registro',
    passwordField: 'pass_registro',
    passReqToCallback: true
}, async (req, correo_registro, pass_registro, done) => {

    const {nombre_registro, apellidopat_registro, apellidomat_registro,fecnac_registro, telefono_registro, rfc_registro, tipoUsr} = req.body;

    const newUser = {
        us_Nombre: nombre_registro,
        us_ApPaterno: apellidopat_registro,
        us_ApMaterno: apellidomat_registro,
        us_FechaNac: fecnac_registro,
        us_Tipo: tipoUsr,
        us_Telefono: telefono_registro,
        us_RFC: rfc_registro,
        us_Email: correo_registro,
        us_Password: pass_registro
    };

    newUser.us_Password = await helpers.encryptPassword(pass_registro);

    console.log(newUser);

    const res = await pool.query('INSERT INTO USUARIO SET ?', [newUser]);
    return done(null, newUser);
}));

passport.serializeUser((user, done) => {
    done(null, user.us_Email);
});

passport.deserializeUser(async (correo_registro, done) => {
    const rows = await pool.query('SELECT * FROM USUARIO WHERE us_Email = ?', [correo_registro]);
    done(null, rows[0]);
});