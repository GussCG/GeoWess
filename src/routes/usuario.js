const express = require('express');
const router = express.Router();

const pool = require('../database');
const {
    isLoggedIn
} = require('../lib/auth');
const sgMail = require('@sendgrid/mail');

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

//Añadir usuarios
router.get('/anadir-usuario/:id', isLoggedIn, async (req, res) => {

    const id = req.params.id;

    const usuario = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [id]);
    
    //Obtener a los Supervisores
    const supervisores = await pool.query('SELECT * FROM USUARIO WHERE us_Tipo = 1');

    //Obtener a los Superintentendes
    const superintendentes = await pool.query('SELECT * FROM USUARIO WHERE us_Tipo = 2');

    //Obtener a los Residentes
    const residentes = await pool.query('SELECT * FROM USUARIO WHERE us_Tipo = 3');

    //Obtener a los Contratistas
    const contratistas = await pool.query('SELECT * FROM USUARIO WHERE us_Tipo = 4');

    //Obtener a los Contratantes
    const contratantes = await pool.query('SELECT * FROM USUARIO WHERE us_Tipo = 5');

    //Obtener a los Representantes legales
    const representantes = await pool.query('SELECT * FROM USUARIO WHERE us_Tipo = 6');

    //Obtener a las Supervisoras
    const supervisoras = await pool.query('SELECT * FROM USUARIO WHERE us_Tipo = 7');

    //Obtener a los Supervisantes
    const supervisantes = await pool.query('SELECT * FROM USUARIO WHERE us_Tipo = 8');

    res.render('usuario/anadir-usuario', {
        usuario: usuario[0],
        supervisores,
        superintendentes,
        residentes,
        contratistas,
        contratantes,
        representantes,
        supervisoras,
        supervisantes,
        layout: 'logged-layout'
    });

});

router.post('/anadir-usuario/:id', isLoggedIn, async (req, res) => {

    const id = req.params.id;

    if (req.user.us_Tipo == 4) {
        const {
            rep_legal,
            supervisante
        } = req.body;

        console.log("representante legal: "+rep_legal);
        console.log("supervisante: "+supervisante);

        //Mandar email al representante legal y al supervisante
        //Buscar el email del representante legal
        const email_rep_legal = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [rep_legal]);

        //Buscar el email del supervisante
        const email_supervisante = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [supervisante]);

        //Buscar el nombre del contratista
        const nombre_contratista = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [id]);

        //Enviar email al representante legal
        const msg_rep_legal = {
            to: email_rep_legal[0].us_Email,
            from: 'geowess.contact@gmail.com',
            subject: 'Nuevo contratista asignado',
            text: 'Hola, '+email_rep_legal[0].us_Nombre+' '+email_rep_legal[0].us_ApPaterno+' '+email_rep_legal[0].us_ApMaterno+'.\n\nEl contratista '+nombre_contratista[0].us_Nombre+' '+nombre_contratista[0].us_ApPaterno+' '+nombre_contratista[0].us_ApMaterno+' ha sido asignado a tu cuenta.\n\nSaludos,\nGeowess.',
            html: 'Hola, <strong>'+email_rep_legal[0].us_Nombre+' '+email_rep_legal[0].us_ApPaterno+' '+email_rep_legal[0].us_ApMaterno+'</strong>.<br><br>El contratista <strong>'+nombre_contratista[0].us_Nombre+' '+nombre_contratista[0].us_ApPaterno+' '+nombre_contratista[0].us_ApMaterno+'</strong> ha sido asignado a tu cuenta.<br><br>Saludos,<br>Geowess.',
        };

        sgMail.send(msg_rep_legal);
        
        //Enviar email al supervisante
        const msg_supervisante = {
            to: email_supervisante[0].us_Email,
            from: 'geowess.contact@gmail.com',
            subject: 'Nuevo contratista asignado',
            text: 'Hola, '+email_supervisante[0].us_Nombre+' '+email_supervisante[0].us_ApPaterno+' '+email_supervisante[0].us_ApMaterno+'.\n\nEl contratista '+nombre_contratista[0].us_Nombre+' '+nombre_contratista[0].us_ApPaterno+' '+nombre_contratista[0].us_ApMaterno+'  te ha asignado a su proyecto.\n\nSaludos,\nGeowess.',
            html: 'Hola, <strong>'+email_supervisante[0].us_Nombre+' '+email_supervisante[0].us_ApPaterno+' '+email_supervisante[0].us_ApMaterno+'</strong>.<br><br>El contratista <strong>'+nombre_contratista[0].us_Nombre+' '+nombre_contratista[0].us_ApPaterno+' '+nombre_contratista[0].us_ApMaterno+'</strong>  te ha asignado a su proyecto.<br><br>Saludos,<br>Geowess.',
        };

        sgMail.send(msg_supervisante);
        const r2 = pool.query('UPDATE CONTRATISTA SET cta_RepresentanteLegal = ?, cta_Supervisante = ? WHERE cta_Usuario = ?', [rep_legal, supervisante, id]);
        req.flash('success', 'Datos actualizados correctamente');
        res.redirect('/profile');
    } else if (req.user.us_Tipo == 5) {
        const {
            residente
        } = req.body;

        console.log("residente: "+residente);

        //Buscar el id del residente
        const id_residente = await pool.query('SELECT * FROM RESIDENTE WHERE res_Usuario = ?', [residente]);

        //Buscar el nombre del contratante
        const nombre_contratante = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [id]);

        //Enviar email al residente
        const email_residente = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [residente]);

        const msg_residente = {
            to: email_residente[0].us_Email,
            from: 'geowess.contact@gmail.com',
            subject: 'Nuevo contratante asignado',
            text: 'Hola, '+email_residente[0].us_Nombre+' '+email_residente[0].us_ApPaterno+' '+email_residente[0].us_ApMaterno+'.\n\nEl contratante '+nombre_contratante[0].us_Nombre+' '+nombre_contratante[0].us_ApPaterno+' '+nombre_contratante[0].us_ApMaterno+' te ha asignado a su proyecto.\n\nSaludos,\nGeowess.',
            html: 'Hola, <strong>'+email_residente[0].us_Nombre+' '+email_residente[0].us_ApPaterno+' '+email_residente[0].us_ApMaterno+'</strong>.<br><br>El contratante <strong>'+nombre_contratante[0].us_Nombre+' '+nombre_contratante[0].us_ApPaterno+' '+nombre_contratante[0].us_ApMaterno+'</strong>  te ha asignado a su proyecto.<br><br>Saludos,<br>Geowess.',
        };

        sgMail.send(msg_residente);

        const r3 = pool.query('UPDATE CONTRATANTE SET cte_Residente = ? WHERE cte_Usuario = ?', [id_residente[0].res_ID, id]);

        //Meter a User_has_Projects
        const r4 = pool.query('INSERT INTO USER_HAS_PROJECTS (up_Usuario, up_Proyecto) VALUES (?, ?)', [id, id_residente[0].res_Proyecto]);

        req.flash('success', 'Datos actualizados correctamente');
        res.redirect('/profile');
    } else if (req.user.us_Tipo == 7) {
        const {
            supervisor,
            rep_legal
        } = req.body;

        //Buscar el email del supervisor
        const email_supervisor = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [supervisor]);

        //Buscar el email del representante legal
        const email_rep_legal = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [rep_legal]);

        //Buscar el nombre de la supervisora
        const nombre_supervisora = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [id]);

        //Enviar email al supervisor
        const msg_supervisor = {
            to: email_supervisor[0].us_Email,
            from: 'geowess.contact@gmail.com',
            subject: 'Nuevo supervisor asignado',
            text: 'Hola, '+email_supervisor[0].us_Nombre+' '+email_supervisor[0].us_ApPaterno+' '+email_supervisor[0].us_ApMaterno+'.\n\nLa supervisora '+nombre_supervisora[0].us_Nombre+' '+nombre_supervisora[0].us_ApPaterno+' '+nombre_supervisora[0].us_ApMaterno+' te ha asignado a su proyecto\n\nSaludos,\nGeowess.',
            html: 'Hola, <strong>'+email_supervisor[0].us_Nombre+' '+email_supervisor[0].us_ApPaterno+' '+email_supervisor[0].us_ApMaterno+'</strong>.<br><br>La supervisora <strong>'+nombre_supervisora[0].us_Nombre+' '+nombre_supervisora[0].us_ApPaterno+' '+nombre_supervisora[0].us_ApMaterno+'</strong>  te ha asignado a su proyecto.<br><br>Saludos,<br>Geowess.',
        };

        const newUHP = {
            up_ID: getID(),
            up_Usuario: supervisor,
            up_Proyecto: email_supervisor[0].us_Proyecto
        };


        //Meter a User_has_Projects
        const r = pool.query('INSERT INTO USER_HAS_PROJECTS (up_Usuario, up_Proyecto) VALUES (?, ?)', [id, email_supervisor[0].us_Proyecto]);

        sgMail.send(msg_supervisor);
        const r4 = pool.query('UPDATE SUPERVISORA SET spa_Supervisor = ?, spa_RepresentanteLegal = ? WHERE spa_Usuario = ?', [supervisor, rep_legal, id]);

        req.flash('success', 'Datos actualizados correctamente');
        res.redirect('/profile');   
    }
});

module.exports = router;