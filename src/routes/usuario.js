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
router.get('/editar-perfil/:id', isLoggedIn, async (req, res) => {

    const id = req.params.id;

    const usuario = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [id]);

    res.render('usuario/editar-perfil', {usuario: usuario[0], layout: 'logged-layout'});
});

router.post('/editar-perfil/:id', isLoggedIn, async (req, res) => {
    let {nombre_user, apPaterno_user, apMaterno_user, telefono_user, email_user, RFC_user } = req.body;

    const nuevoUsuario = {
        us_Nombre: nombre_user,
        us_ApPaterno: apPaterno_user,
        us_ApMaterno: apMaterno_user,
        us_Telefono: telefono_user,
        us_Email: email_user,
        us_RFC: RFC_user
    };

    const id = req.params.id;
    const r = pool.query(`UPDATE USUARIO SET us_Nombre = '${nuevoUsuario.us_Nombre}', us_ApPaterno = '${nuevoUsuario.us_ApPaterno}', us_ApMaterno = '${nuevoUsuario.us_ApMaterno}', us_Telefono = '${nuevoUsuario.us_Telefono}', us_Email = '${nuevoUsuario.us_Email}', us_RFC = '${nuevoUsuario.us_RFC}' WHERE us_ID = ${id}`);

    if (r.affectedRows > 0) {
        req.flash('success', 'Perfil actualizado correctamente');
        res.redirect('/profile');
    } else {
        req.flash('message', 'Ocurrió un error al actualizar el perfil');
        res.redirect('/profile');
    }
});

module.exports = router;