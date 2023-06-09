const express = require('express');
const router = express.Router();

const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

// Formatear fechas
const dateFormat = (date) => {
    let fecha = new Date(date);
    let dia = fecha.getDate();
    let mes = fecha.getMonth() + 1;
    let anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

//Editar usuario
router.get('/editar-perfil', isLoggedIn, async (req, res) => {

    const usuario = await pool.query('SELECT * FROM USUARIO WHERE us_Email = ?', [req.user.us_Email]);

    res.render('usuario/editar-perfil', {usuario: usuario[0], layout: 'logged-layout'});
});

router.post('/editar-perfil', isLoggedIn, async (req, res) => {
    let {nombre_user, apPaterno_user, apMaterno_user, telefono_user, email_user, RFC_user } = req.body;

    const nuevoUsuario = {
        us_Nombre: nombre_user,
        us_ApPaterno: apPaterno_user,
        us_ApMaterno: apMaterno_user,
        us_Telefono: telefono_user,
        us_Email: email_user,
        us_RFC: RFC_user
    };

    const id = req.user.us_ID;
    await pool.query(`UPDATE USUARIO SET ? WHERE us_ID = '${id}'`, [nuevoUsuario]);

    req.flash('success', 'Perfil actualizado correctamente');
    res.redirect('/profile');    
});

module.exports = router;