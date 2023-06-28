const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const helpers = require('../lib/helpers');

const passport = require('passport');
const {
    isLoggedIn,
    isNotLoggedIn
} = require('../lib/auth');

const sgMail = require('@sendgrid/mail');

// Formatear fechas
let dateFormat = (date) => {
    let fecha = new Date(date);
    let dia = fecha.getDate();
    let mes = fecha.getMonth() + 1;
    let anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

//Generar ID random de 6 numeros
let genID = () => {
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return this.toString(id);
}

//Calcular el porcentaje de avance del proyecto
const calcPorcentajeProyecto = async (proyecto) => {
    //Obtener el total de fases del proyecto
    let totalFases = 0;

    const fases = await pool.query('SELECT * FROM FASE_PROYECTO WHERE fp_Proyecto = ?', [proyecto.pr_ID]);
    for await (const fase of fases) {
        totalFases += 1;
    }


    //Obtener el total de fases terminadas
    let totalFasesTerminadas = 0;
    const fasesTerminadas = await pool.query('SELECT * FROM FASE_PROYECTO WHERE fp_Proyecto = ? AND fp_Status = 1', [proyecto.pr_ID]);
    for await (const fase of fasesTerminadas) {
        totalFasesTerminadas += 1;
    }
    //console.log("total fases terminadas: " + totalFasesTerminadas);

    if (totalFases == 0) {
        //console.log("no hay fases");
        return 0;
    } else if (totalFasesTerminadas == 0) {
        //console.log("no hay fases terminadas");
        return 0;
    } else {
        let porcentaje = (totalFasesTerminadas * 100) / totalFases;
        //console.log("porcentaje: " + porcentaje);
        return Math.round(porcentaje);
    }
}

const pool = require('../database');

router.get('/signup', isNotLoggedIn, (req, res) => {
    res.render('auth/signup', {
        layout: 'auth-layout'
    }); // src\views\auth\signup.hbs
});

router.post('/signup', isNotLoggedIn, passport.authenticate('local.signup', {
    successRedirect: 'profile',
    failureRedirect: '/signup',
    failureFlash: true
}));

router.get('/signin', isNotLoggedIn, (req, res) => {
    res.render('auth/signin', {
        layout: 'auth-layout'
    });
});

router.post('/signin', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local.signin', {
        successRedirect: 'profile',
        failureRedirect: '/signin',
        failureFlash: true
    })(req, res, next);
});

//Dashboard
router.get('/profile', isLoggedIn, async (req, res) => {
    //Obtener los proyectos del usuario
    const q1 = await pool.query('SELECT * FROM USUARIO_HAS_PROJECTS WHERE up_Usuario = ?', [req.user.us_ID]);

    //Si son los primeros 5 dias del mes, mandar correo al superintendente para que genere el reporte mensual
    let fecha = new Date();
    let dia = fecha.getDate();
    if (dia <= 10) {
        //Obtener el correo del superintendente
        //Obtengo el proyecto
        const q2 = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [q1[0].up_Proyecto]);
        //Obtengo la estimacion
        const q3 = await pool.query('SELECT * FROM ESTIMACION WHERE es_Proyecto = ?', [q2[0].pr_ID]);
        //Obtengo el superintendente
        const q4 = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [q3[0].es_Superintendente]);

        //Enviar el correo
        const msg_supervisante = {
            to: q4[0].us_Email,
            from: 'geowess.contact@gmail.com',
            subject: 'Reporte Mensual',
            text: 'Hola, '+q4[0].us_Nombre+' '+q4[0].us_ApPaterno+' '+q4[0].us_ApMaterno+'.\n\nEl proyecto '+q2[0].pr_Nombre+' ha terminado su mes de trabajo.\n\nSaludos,\nGeowess.',
            html: '<strong>Hola, '+q4[0].us_Nombre+' '+q4[0].us_ApPaterno+' '+q4[0].us_ApMaterno+'.<br><br>El proyecto '+q2[0].pr_Nombre+' ha terminado su mes de trabajo.\n Realice el reporte mensual.<br><br>Saludos,<br>Geowess.</strong>',
        };
        sgMail.send(msg_supervisante);
    }

    //Despues de que se genere el avance mensual, se debe de mandar un correo a la supervisora para que lo valide
    if (dia <= 10) {
        //Obtener el correo de la supervisora
        //Obtengo el proyecto
        const q2 = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [q1[0].up_Proyecto]);
        //Obtengo la estimacion
        const q3 = await pool.query('SELECT * FROM ESTIMACION WHERE es_Proyecto = ?', [q2[0].pr_ID]);
        //Obtengo la supervisora
        const q4 = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [q3[0].es_Supervisora]);

        //Enviar el correo
        const msg_supervisora = {
            to: q4[0].us_Email,
            from: 'geowess.contact@gmail.com',
            subject: 'Validar Reporte Mensual',
            text: 'Hola, '+q4[0].us_Nombre+' '+q4[0].us_ApPaterno+' '+q4[0].us_ApMaterno+'.\n\nEl proyecto '+q2[0].pr_Nombre+' ha terminado su mes de trabajo.\n\nSaludos,\nGeowess.',
            html: '<strong>Hola, '+q4[0].us_Nombre+' '+q4[0].us_ApPaterno+' '+q4[0].us_ApMaterno+'.<br><br>El proyecto '+q2[0].pr_Nombre+' ha terminado su mes de trabajo.\n Valide el reporte mensual.<br><br>Saludos,<br>Geowess.</strong>',
        };

        sgMail.send(msg_supervisora);
    }

    console.log(q1);
    if (q1.length == 0) {
        let proyectos = [];
        res.render('dashboard', {
            proyectos,
            layout: 'logged-layout'
        });
    } else {
        let proyectos = [];
        for await (const proyecto of q1) {
            const q2 = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [proyecto.up_Proyecto]);
            proyectos.push(q2[0]);
        }

        //Obtener el porcentaje de avance de cada proyecto con foreach
        proyectos.forEach(async (proyecto) => {
            proyecto.pr_Porcentaje = await calcPorcentajeProyecto(proyecto);
            console.log("PA: "+proyecto.pr_Porcentaje);

            //Update a la base de datos
            await pool.query('UPDATE PROYECTO SET pr_PorcentajeAvance = ? WHERE pr_ID = ?', [proyecto.pr_Porcentaje, proyecto.pr_ID]);
        });
        

        //Formatear las fechas
        for await (const proyecto of proyectos) {
            proyecto.pr_FechaInicio = dateFormat(proyecto.pr_FechaInicio);
            proyecto.pr_FechaFin = dateFormat(proyecto.pr_FechaFin);
        }

        //console.log(proyectos);

        res.render('dashboard', {
            proyectos,
            layout: 'logged-layout'
        });
    }


});

router.get('/logout', isLoggedIn, (req, res) => {
    req.logOut(req.user, err => {
        if (err) {
            console.log(err);
        }
        req.flash('success', 'Sesión cerrada');
        res.redirect('/');
    })
});

//Recuperar contraseña
//Vista
router.get('/recuperar-contrasena', (req, res) => {
    res.render('auth/recuperarpass', {
        layout: 'auth-layout'
    });
});

//Enviar correo
router.post('/recuperar-contrasena', async (req, res) => {
    //Obtener el correo
    const {
        recuperar_Correo
    } = req.body;

    if (!recuperar_Correo) {
        req.flash('message', 'No se ha recibido ningún dato');
        res.redirect('/recuperar-contrasena');
        return;
    }

    var msg = "Revisa tu correo para recuperar tu contraseña";
    let verificationLink;
    let emailStatus = "OK";

    try {
        //Buscar el correo en la base de datos para saber si existe
        const correo = await pool.query('SELECT * FROM USUARIO WHERE us_Email = ?', [recuperar_Correo]);
        const userID = correo[0].us_ID;
        //console.log(userID);
        const token = userID;

        verificationLink = "http://localhost:3000/nueva-contrasena/" + token;
        //console.log(verificationLink);
    } catch (error) {
        req.flash('message', 'El correo no existe');
        res.redirect('/recuperar-contrasena');
        return;
    }

    //Enviar el correo
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'GeoWess.Contact@gmail.com',
                pass: 'ohsewyjdwzeznlqq'
            },
        });

        let info = await transporter.sendMail({
            from: '"Olvido Contraseña 😳" <GeoWess.Contact@gmail.com>',
            to: recuperar_Correo,
            subject: "Recuperar Contraseña",
            html: `
               <h2>Recuperar Contraseña</h2>
               <p>Para recuperar tu contraseña da click en el siguiente enlace:</p>
               <a href="${verificationLink}">${verificationLink}</a>  
            `,
        });
    } catch (error) {
        emailStatus = error;
        return res.status(400).send({
            msg: error.message
        });
    }

    try {

    } catch (error) {
        emailStatus = error;
        return res.status(400).send({
            msg: error.message
        });
    }

    res.render('auth/recuperarpass', {
        layout: 'auth-layout'
    });

});

//Nueva contraseña
//Vista
router.get('/nueva-contrasena/:token', async (req, res) => {
    const token = req.params.token;

    if (!token) {
        req.flash('message', 'No se ha recibido ningún dato');
        res.redirect('/recuperar-contrasena');
        return;
    }

    try {
        const user = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [token]);
        if (!user) {
            req.flash('message', 'El usuario no existe');
            res.redirect('/recuperar-contrasena');
            return;
        }
        res.render('auth/nueva-contrasena', {
            token,
            layout: 'auth-layout'
        });
    } catch (error) {
        return res.status(401).send({
            msg: error.message
        });
    }
});

//Cambiar contraseña
router.post('/nueva-contrasena/:token', async (req, res) => {
    const token = req.params.token;

    if (!token) {
        req.flash('message', 'No se ha recibido ningún dato');
        res.redirect('/recuperar-contrasena');
        return;
    }

    //Obtener la nueva contraseña
    const {
        nueva_Contrasena
    } = req.body;

    try {
        //Actualizar la contraseña
        //Encriptar la contraseña
        let contrasena = await helpers.encryptPassword(nueva_Contrasena);
        console.log(contrasena);
        pool.query('UPDATE USUARIO SET us_Password = ? WHERE us_ID = ?', [contrasena, token]);
        res.redirect('/signin');
    } catch (error) {
        return res.status(401).send({
            msg: error.message
        });
    }
});


module.exports = router;