const express = require('express');
const router = express.Router();

const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { render } = require('timeago.js');
const { CanvasRenderService } = require('chartjs-node-canvas');


const jsdom = require("jsdom");
const { JSDOM } = jsdom;

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

//Colores para las gráficas
const getDataColors = data => {
    const colors = [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(216, 184, 255)',
        'rgb(153, 102, 255)',
        'rgb(192, 255, 184)',
        'rgb(255, 153, 153)',
        'rgb(255, 153, 255)',
        'rgb(255, 255, 153)',
        'rgb(110, 94, 78)',
    ];

    return data.map((_, index) => colors[index]);
}

//Calcular el porcentaje de avance con el tiempo
const calcPorcentaje = (fase) => {
    let inicio = new Date(fase.fp_FechaInicio).getTime();
    let fin = new Date(fase.fp_FechaFin).getTime();

    if (inicio == fin){
        return 100;
    }

    //console.log("inicio: " + inicio);

    let dia_ms = 1000 * 60 * 60 * 24;

    //Calcular el total de dias que dura la fase
    let total_ms = fin - inicio;
    //let total = Math.floor(total_ms / dia_ms);
    //console.log("total de dias: " +total);

    //Calcular los dias que han pasado desde el inicio de la fase
    let today = new Date().getTime();
    let fecha_ms = today - inicio;
    //let dias = Math.floor(fecha / dia_ms);
    //console.log("dias que han pasado: " + dias);

    //Calcular el porcentaje
    let porcentaje = (fecha_ms * 100) / total_ms;
    //console.log("porcentaje: " + porcentaje);

    return Math.round(porcentaje);
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

    //console.log(proyectos);

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
    res.redirect('ver-proyecto/' + newProyect.pr_ID);
});

//Ver-Proyecto
//Renderizar la vista
router.get('/ver-proyecto/:pr_id', isLoggedIn, async (req, res) => {
    const {pr_id} = req.params;
    const proyecto = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [pr_id]);
    const fases = await pool.query('SELECT * FROM FASE_PROYECTO WHERE fp_Proyecto = ?', [pr_id]);
    
    proyecto.forEach(proyecto => {
        fases.forEach(fase =>{
            fase.fp_PorcentajeAvance = calcPorcentaje(fase);
            //Actualizar el porcentaje de avance de la fase en la base de datos
            let query = 'UPDATE FASE_PROYECTO SET fp_PorcentajeAvance = ? WHERE fp_ID = ?';
            pool.query(query, [fase.fp_PorcentajeAvance, fase.fp_ID]);
            //Si la fase ya termino, cambiar su status a 1
            if (fase.fp_PorcentajeAvance == 100){
                let query2 = 'UPDATE FASE_PROYECTO SET fp_Status = 1 WHERE fp_ID = ?';
                pool.query(query2, [fase.fp_ID]);
            }
        }, this);
    });

    //Dar formato a las fechas
    proyecto[0].pr_FechaInicio = dateFormat(proyecto[0].pr_FechaInicio);
    proyecto[0].pr_FechaFin = dateFormat(proyecto[0].pr_FechaFin);

    //Dar formato a las fechas de las fases
    fases.forEach(fase => {
        fase.fp_FechaInicio = dateFormat(fase.fp_FechaInicio);
        fase.fp_FechaFin = dateFormat(fase.fp_FechaFin);
    });

    //Se crea la gráfica de fases
    const canvasRenderService = new CanvasRenderService(800, 600, (ChartJS) => {
        console.log("Creando gráfica de fases");
    });

    // console.log(proyecto);
    // console.log(fases);

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

//Catalogo de conceptos
//Renderizar la vista
router.get('/catalogo-conceptos/:pr_id', isLoggedIn, async (req, res) => {
    const {pr_id} = req.params;
    const catalogo = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [pr_id]);
    const partidas = await pool.query('SELECT * FROM PARTIDA WHERE pt_CatalogoConceptos = ?', [catalogo[0].pr_CatalogoConceptos]);

    console.log(partidas);
    res.render('proyectos/partidas-vista', {catalogo: catalogo[0], partidas, layout: 'logged-layout'});
});
  
//Crear fases de proyecto
//Renderizar la vista
router.get('/crear-fase/:pr_id', isLoggedIn, async (req, res) => {
    const {pr_id} = req.params;

    res.render('proyectos/crear-fase', {pr_id, layout: 'logged-layout'});
});

//Crear una fase
router.post('/crear-fase/:pr_id', isLoggedIn, async (req, res) => {
    const {pr_id} = req.params;
    //console.log(pr_id);

    const {nombre_fase, fechaInicio_fase, fechaFin_fase} = req.body;

    const newFase = {
        fp_ID: genID(),
        fp_Nombre: nombre_fase,
        fp_FechaInicio: fechaInicio_fase,
        fp_FechaFin: fechaFin_fase,
        fp_Status: 0, // 0 -> En proceso, 1 -> Terminado
        fp_PorcentajeAvance: 0,
        fp_Proyecto: pr_id
    }

    let query = 'INSERT INTO FASE_PROYECTO SET ?';
    await pool.query(query, [newFase]);

    req.flash('success', "Se ha creado la fase");
    res.redirect('/proyectos/ver-proyecto/' + pr_id);
});
    

module.exports = router;