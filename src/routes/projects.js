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

    proyectos.forEach(proyecto => {
        proyecto.pr_FechaInicio = dateFormat(proyecto.pr_FechaInicio);
        proyecto.pr_FechaFin = dateFormat(proyecto.pr_FechaFin);
    });

    console.log(proyectos);

    res.render('proyectos/proyectos-index', {proyectos, layout: 'logged-layout'});
});  

//Crear-Proyecto
//Renderizar la vista
router.get('/crear-proyecto', isLoggedIn, async (req, res) =>{
    res.render('proyectos/crear-proyecto', {layout: 'logged-layout'});    
});

//Crear un proyecto
router.post('/crear-proyecto', isLoggedIn, async (req, res) =>{
    const {nombre_proyecto, fechainicio_proyecto, fechafin_proyecto, direccion_proyecto, ciudad_proyecto, estado_proyecto, pais_proyecto, cp_proyecto} = req.body;
    let pr_Ubicacion = direccion_proyecto + ', ' + ciudad_proyecto + ', ' + estado_proyecto + ', ' + pais_proyecto + ', ' + cp_proyecto;

    const newProyect = {
        pr_ID: genID(),
        pr_Nombre: nombre_proyecto,
        pr_FechaInicio: fechainicio_proyecto,
        pr_FechaFin: fechafin_proyecto,
        pr_Status: 0, // 0 -> En proceso, 1 -> Terminado
        pr_CostoTotal: 0.0,
        pr_Ubicacion,
        pr_Usuario: req.user.us_ID,
        pr_CatalogoConceptos: genID(),
    }

    let query = 'INSERT INTO PROYECTO SET ?';
    await pool.query(query, [newProyect]);

    //Se crea un catalogo de conceptos para el proyecto
    let query2 = 'INSERT INTO CATALOGO_CONCEPTOS SET ?';
    await pool.query(query2, [{cc_ID: newProyect.pr_CatalogoConceptos}]);

    req.flash('success', "Se ha creado el proyecto");
    res.redirect('/');
});

//Ver-Proyecto
//Renderizar la vista
router.get('/ver-proyecto/:pr_id', isLoggedIn, async (req, res) => {
    const {pr_id} = req.params;
    const proyecto = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [pr_id]);
    const fases = await pool.query('SELECT * FROM FASE_PROYECTO WHERE fp_Proyecto = ?', [pr_id]);
    
    proyecto.forEach(proyecto => {
        proyecto.pr_FechaInicio = dateFormat(proyecto.pr_FechaInicio);
        proyecto.pr_FechaFin = dateFormat(proyecto.pr_FechaFin);
    });

    console.log(proyecto);
    console.log(fases);

    res.render('proyectos/ver-proyecto', {proyecto:proyecto[0], fases, layout: 'logged-layout'});
});

//Crear-Partida
//Renderizar la vista
router.get('/crear-partida/:pr_id', isLoggedIn, async (req, res) => {
    const {pr_id} = req.params;
    res.render('proyectos/crear-partida', {pr_id, layout: 'logged-layout'});
});

//Crear una partida
router.post('/crear-partida/:pr_id', isLoggedIn, async (req, res) => {
    const {pr_id} = req.params;
    const {partida_nombre} = req.body;

    //Obtener el catalogo de conceptos del proyecto
    const catalogo = await pool.query('SELECT pr_CatalogoConceptos FROM PROYECTO WHERE pr_ID = ?', [pr_id]);

    const newPartida = {
        pt_ID: genID(),
        pt_Nombre: partida_nombre,
        pt_CatalogoConceptos: catalogo[0].pr_CatalogoConceptos
    }

    let query = 'INSERT INTO PARTIDA SET ?';
    await pool.query(query, [newPartida]);

    req.flash('success', "Se ha creado la partida, ahora debes crear las fases");


});

module.exports = router;