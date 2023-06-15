const express = require('express');
const router = express.Router();

const passport = require('passport');
const {isLoggedIn, isNotLoggedIn} = require('../lib/auth');

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
    for(let i = 0; i < 6; i++){
        id += Math.floor(Math.random() * 10);
    }
    return id;
}

const pool = require('../database');

router.get('/signup', isNotLoggedIn, (req, res) => {
    res.render('auth/signup', {layout: 'main'}); // src\views\auth\signup.hbs
});

router.post('/signup', isNotLoggedIn, passport.authenticate('local.signup', {
    successRedirect: 'profile',
    failureRedirect: '/signup',
    failureFlash: true
}));

router.get('/signin', isNotLoggedIn, (req, res) => {
    res.render('auth/signin', {layout: 'main'});
});

router.post('/signin', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local.signin', {
        successRedirect: 'profile',
        failureRedirect: '/signin',
        failureFlash: true
    })(req, res, next);
});

router.get('/profile',isLoggedIn, async (req, res) => {
    const proyectos = await pool.query('SELECT * FROM PROYECTO WHERE pr_Usuario = ?', [req.user.us_ID]);
    proyectos.forEach(proyecto => {
        proyecto.pr_FechaInicio = dateFormat(proyecto.pr_FechaInicio);
        proyecto.pr_FechaFin = dateFormat(proyecto.pr_FechaFin);
        proyecto.pr_PorcentajeAvance = 50;
    });
    // //Calcular el porcentaje de avance de cada fase    
    // proyectos.forEach(async proyecto => {
    //     proyecto.pr_FechaInicio = dateFormat(proyecto.pr_FechaInicio);
    //     proyecto.pr_FechaFin = dateFormat(proyecto.pr_FechaFin);
    //     const fases = await pool.query('SELECT * FROM FASE_PROYECTO WHERE fp_Proyecto = ?', [proyecto.pr_ID]);
    //     fases.forEach(fase => {
    //         fase.fp_FechaInicio = dateFormat(fase.fp_FechaInicio);
    //         fase.fp_FechaFin = dateFormat(fase.fp_FechaFin);
    //     });
    //     fases.forEach(fase => {
    //         fase.porcentaje = calcPorcentaje(fase);
    //         pool.query('UPDATE FASE_PROYECTO SET fp_PorcentajeAvance = ? WHERE fp_ID = ?', [fase.porcentaje, fase.fp_ID]);
    //     });
    // });

    // //Calcular el porcentaje de avance de cada proyecto
    // proyectos.forEach(async proyecto => {
    //     const fases = await pool.query('SELECT * FROM FASE_PROYECTO WHERE fp_Proyecto = ?', [proyecto.pr_ID]);
    //     let porcentaje = 0;
    //     fases.forEach(fase => {
    //         porcentaje += fase.fp_PorcentajeAvance;
    //     });
    //     porcentaje = porcentaje / fases.length;
    //     pool.query('UPDATE PROYECTO SET pr_PorcentajeAvance = ? WHERE pr_ID = ?', [porcentaje, proyecto.pr_ID]);
    // });
    
    res.render('dashboard', {proyectos, layout: 'logged-layout'});
});

router.get('/logout', isLoggedIn, (req, res) => {
    req.logOut(req.user, err => {
        if(err){
            console.log(err);
        }
        res.redirect('/');
    })
});

module.exports = router;