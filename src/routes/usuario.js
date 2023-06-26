const express = require('express');
const router = express.Router();

const pool = require('../database');
const {
    isLoggedIn
} = require('../lib/auth');

// Formatear fechas
const dateFormat = (date) => {
    let fecha = new Date(date);
    let dia = fecha.getDate();
    let mes = fecha.getMonth() + 1;
    let anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

//Formatear Fecha para inputs {yyyy-mm-dd}
const formatDateInput = (date) => {
    let fecha = new Date(date);
    let dia = fecha.getDate();
    let mes = fecha.getMonth() + 1;

    if (mes < 10) {
        mes = '0' + mes;
    }

    if (dia < 10) {
        dia = '0' + dia;
    }

    let anio = fecha.getFullYear();
    return `${anio}-${mes}-${dia}`;
}

//Editar usuario
router.get('/editar-perfil/:id', isLoggedIn, async (req, res) => {

    const id = req.params.id;

    const usuario = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [id]);

    //Formatear fecha
    usuario[0].us_FechaNac = formatDateInput(usuario[0].us_FechaNac);

    res.render('usuario/editar-perfil', {
        usuario: usuario[0],
        layout: 'logged-layout'
    });
});

router.post('/editar-perfil/:id', isLoggedIn, async (req, res) => {
    let {
        nombre_user,
        apPaterno_user,
        apMaterno_user,
        fecnac_registro,
        telefono_user,
        email_user,
        RFC_user
    } = req.body;

    const nuevoUsuario = {
        us_Nombre: nombre_user,
        us_ApPaterno: apPaterno_user,
        us_ApMaterno: apMaterno_user,
        us_FechaNac: fecnac_registro,
        us_Telefono: telefono_user,
        us_Email: email_user,
        us_RFC: RFC_user
    };

    const id = req.params.id;
    
    const r = pool.query('UPDATE USUARIO SET ? WHERE us_ID = ?', [nuevoUsuario, id]);

    req.flash('success', 'Datos actualizados correctamente');
    res.redirect('/profile');
});

module.exports = router;