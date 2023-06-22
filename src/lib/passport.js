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

    const {
        nombre_registro,
        apellidopat_registro,
        apellidomat_registro,
        fecnac_registro,
        telefono_registro,
        rfc_registro,
        tipoUsr
    } = req.body;

    const newUser = {
        us_ID: genID(),
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

    //console.log(newUser);

    const res = await pool.query('INSERT INTO USUARIO SET ?', [newUser]);
    //crear el tipo de usuario
    switch (tipoUsr) {
        case '1': //Supervisor
            const res2 = await pool.query('INSERT INTO SUPERVISOR (sp_ID, sp_Usuario) VALUES (?,?)', [genID(), newUser.us_ID]);
            break;
        case '2': //Superintendente
            const res3 = await pool.query('INSERT INTO SUPERINTENDENTE (spi_ID, spi_Usuario) VALUES (?,?)', [genID(), newUser.us_ID]);
            break;
        case '3': //Residente
            const res4 = await pool.query('INSERT INTO RESIDENTE (res_ID, res_Usuario) VALUES (?,?)', [genID(), newUser.us_ID]);
            break;
        case '4': //Contratista
            const res5 = await pool.query('INSERT INTO CONTRATISTA (cta_ID, cta_Usuario) VALUES (?,?)', [genID(), newUser.us_ID]);
            break;
        case '5': //Contratante
            const res6 = await pool.query('INSERT INTO CONTRATANTE (cte_ID, cte_Usuario) VALUES (?,?)', [genID(), newUser.us_ID]);
            break;
        case '6': //Representante legal
            const res7 = await pool.query('INSERT INTO REPRESENTANTE_LEGAL (rpl_ID, rpl_Usuario) VALUES (?,?)', [genID(), newUser.us_ID]);
            break;
        default:
            break;
    }

    return done(null, newUser);
}));

passport.serializeUser((user, done) => {
    done(null, user.us_ID);
});

passport.deserializeUser(async (correo_registro, done) => {
    const rows = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [correo_registro]);
    done(null, rows[0]);
});

let genID = () => {
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return id;
}