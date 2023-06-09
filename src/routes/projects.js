const express = require('express');
const router = express.Router();

const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { render } = require('timeago.js');

//FUNCIONES
//Generar ID random de 6 numeros
let genID = () => {
    let id = '';
    for(let i = 0; i < 6; i++){
        id += Math.floor(Math.random() * 10);
    }
    return id;
}

// Formatear fechas
const dateFormat = (date) => {
    let fecha = new Date(date);
    let dia = fecha.getDate();
    let mes = fecha.getMonth() + 1;
    let anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

//Calcular el porcentaje de avance con el tiempo
const calcPorcentaje = (fase) => {
    let inicio = new Date(fase.fp_FechaInicio);
    let fin = new Date(fase.fp_FechaFin);
    let actual = new Date();
    let porcentaje = 0;

    if(actual < inicio){
        porcentaje = 0;
    }else if(actual > fin){
        porcentaje = 100;
    }else{
        let total = fin.getTime() - inicio.getTime();
        let actual = actual.getTime() - inicio.getTime();
        porcentaje = (actual * 100) / total;
    }
}

//RUTAS
//Proyectos index
router.get('/', async (req, res) => {

    //Obtener los proyectos del usuario
    const proyectos = await pool.query('SELECT * FROM PROYECTO WHERE pr_Usuario = ?', [req.user.us_ID]);

    res.render('proyectos/proyectos-index', {proyectos, layout: 'logged-layout'});
});  

//Crear un proyecto
router.get('/crear-proyecto', isLoggedIn, async (req, res) =>{
    res.send('Crear proyecto');     
});

module.exports = router;