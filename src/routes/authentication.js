const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const helpers = require('../lib/helpers');

const passport = require('passport');
const {
    isLoggedIn,
    isNotLoggedIn
} = require('../lib/auth');

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
    const proyectos = await pool.query('SELECT * FROM PROYECTO WHERE pr_Usuario = ?', [req.user.us_ID]);
    proyectos.forEach(proyecto => {
        proyecto.pr_FechaInicio = dateFormat(proyecto.pr_FechaInicio);
        proyecto.pr_FechaFin = dateFormat(proyecto.pr_FechaFin);
    });

    //Calcular el porcentaje de avance de cada proyecto y editarlo en la base de datos
    proyectos.forEach(async proyecto => {
        //Calcular el porcentaje de avance de cada proyecto
        proyecto.pr_PorcentajeAvance = await calcPorcentajeProyecto(proyecto);
        //Editar el porcentaje de avance en la base de datos
        pool.query('UPDATE PROYECTO SET pr_PorcentajeAvance = ? WHERE pr_ID = ?', [proyecto.pr_PorcentajeAvance, proyecto.pr_ID]);
    });

    res.render('dashboard', {
        proyectos,
        layout: 'logged-layout'
    });
});

router.get('/logout', isLoggedIn, (req, res) => {
    req.logOut(req.user, err => {
        if (err) {
            console.log(err);
        }
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

    if (!id) {
        req.flash('message', 'No se ha recibido ningún dato');
        res.redirect('/recuperar-contrasena');
        return;
    }

    try {
        const user = await pool.query('SELECT * FROM USUARIO WHERE us_ID = ?', [id]);
        if (!user) {
            req.flash('message', 'El usuario no existe');
            res.redirect('/recuperar-contrasena');
            return;
        }
        res.render('auth/nueva-contrasena', {
            id,
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

    if (!id) {
        req.flash('message', 'No se ha recibido ningún dato');
        res.redirect('/recuperar-contrasena');
        return;
    }

    //Obtener la nueva contraseña
    const {
        nueva_Contrasena
    } = req.body;

    if (!nueva_Contrasena) {
        req.flash('message', 'No se ha recibido ningún dato');
        res.redirect('/nueva-contrasena/' + token);
        return;
    }

    try {
        //Actualizar la contraseña
        //Encriptar la contraseña
        let contrasena = await helpers.encryptPassword(nueva_Contrasena);
        console.log(contrasena);
        pool.query('UPDATE USUARIO SET us_Password = ? WHERE us_ID = ?', [contrasena, id]);
        res.redirect('/signin');
    } catch (error) {
        return res.status(401).send({
            msg: error.message
        });
    }
});


module.exports = router;