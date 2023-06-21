const express = require('express');
const router = express.Router();

const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

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
router.get('/crear-proyecto',  (req, res) => {
    // res.send('Crear proyecto');
    console.log('Crear proyecto');
    // res.render('proyecto/crear-proyecto', {layout: 'logged-layout'});
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
        pr_Usuario: req.user.us_Email,
        pr_CatalogoConceptos: genID(),
    }

    let query = 'INSERT INTO PROYECTO SET ?';
    await pool.query(query, [newProyect]);

    //Se crea un catalogo de conceptos para el proyecto
    let query2 = 'INSERT INTO CATALOGO_CONCEPTOS SET ?';
    await pool.query(query2, [{cc_ID: newProyect.pr_CatalogoConceptos}]);

    req.flash('success', "Se ha creado el proyecto, ahora debes crear las partidas");

    res.redirect('proyectos/crear-partida/' + newProyect.pr_ID);
})

router.get('/ver-proyectos', isLoggedIn, async (req, res) => {
    const proyectos = await pool.query('SELECT * FROM PROYECTO WHERE pr_Usuario = ?', [req.user.us_Email]);

    proyectos.forEach(proyecto => {
        proyecto.pr_FechaInicio = dateFormat(proyecto.pr_FechaInicio);
        proyecto.pr_FechaFin = dateFormat(proyecto.pr_FechaFin);
    });

    res.render('proyectos/ver-proyectos', {proyectos, layout: 'logged-layout'});
});

//Enviar a la vista general de un proyecto
router.get('/proyecto/:pr_id', isLoggedIn, async (req, res) => {
    const {pr_id} = req.params;
    const proyecto = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [pr_id]);

    proyecto.forEach(proyecto => {
        proyecto.pr_FechaInicio = dateFormat(proyecto.pr_FechaInicio);
        proyecto.pr_FechaFin = dateFormat(proyecto.pr_FechaFin);
    });

    //Tambien consultar las fases de ese proyecto
    const fases = await pool.query('SELECT * FROM FASE_PROYECTO WHERE fp_Proyecto = ?', [pr_id]);

    fases.forEach(fase => {
        fase.fp_FechaInicio = dateFormat(fase.fp_FechaInicio);
        fase.fp_FechaFin = dateFormat(fase.fp_FechaFin);
    });

    //console.log(fases[0].fp_FechaFin);

    fases.forEach(fase => async () => {
        fase.porcentaje = calcPorcentaje(fase);
        await pool.query('UPDATE FASE_PROYECTO SET fp_PorcentajeAvance = ? WHERE fp_ID = ?', [fase.porcentaje, fase.fp_ID]);
    });

    res.render('proyectos/proyecto', {proyecto: proyecto[0], fases, layout: 'logged-layout'});
});


//Enviar a crear una fase
router.get('/crear-fase/:pr_id', isLoggedIn, (req, res) => {
    const {pr_id} = req.params;
    res.render('proyectos/crear-fase', {pr_id, layout: 'logged-layout'});
});

router.post('/crear-fase/:pr_id', isLoggedIn, async (req, res) => {
    const {nombre_fase, fechaInicio_fase, fechaFin_fase} = req.body;
    const {pr_id} = req.params;

    //console.log(nombre_fase, fechaInicio_fase, fechaFin_fase);

    //Revisar que las fechas esten en el rango del proyecto
    const proyeto = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [pr_id]);
    
    proyeto.forEach(proyecto => {
        proyecto.pr_FechaInicio = dateFormat(proyecto.pr_FechaInicio);
        proyecto.pr_FechaFin = dateFormat(proyecto.pr_FechaFin);
    });

    let fechaInicioFase = dateFormat(fechaInicio_fase);
    let fechaFinFase = dateFormat(fechaFin_fase);

    console.log(proyeto[0].pr_FechaInicio, proyeto[0].pr_FechaFin);
    console.log(fechaInicioFase, fechaFinFase);

    const newFase = {
        fp_ID: genID(),
        fp_Nombre: nombre_fase,
        fp_FechaInicio: fechaInicio_fase,
        fp_FechaFin: fechaFin_fase,
        fp_Status: 0, // 0 -> En proceso, 1 -> Terminado
        fp_PorcentajeAvance: 0,
        fp_Proyecto: pr_id,
    }

    let query = 'INSERT INTO FASE_PROYECTO SET ?';
    await pool.query(query, [newFase]);
    res.redirect('/proyectos/proyecto/'+pr_id); 
});

//Generar estimacion mensual de un proyecto
router.get('/generar-estimacion/:id', isLoggedIn, async (req, res) => {
    const {id} = req.params;
    res.render('pages/generar-estimacion', {id, layout: 'logged-layout'});
});

// router.post('/generar-estimacion/:id', async (req, res) => {
//     const {id} = req.params;
//     const {estimacion_fecha} = req.body;

//     const Fecha = new Date(estimacion_fecha);

//     const mes = Fecha.getMonth() + 1;
//     console.log(mes);

// });

//Crear Partida
router.get('/crear-partida/:pr_id', isLoggedIn, async (req, res) => {
    const {pr_id} = req.params;
    res.render('proyectos/crear-partida', {pr_id, layout: 'logged-layout'});
});

router.post('/crear-partida/:pr_id', isLoggedIn, async (req, res) => {
    const {pr_id} = req.params;
    //Obtener el proyecto
    const proyecto = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [pr_id]);

    //Crear la partida
    const { partida_nombre } = req.body;

    const newPartida = {
        pt_ID: genID(),
        pt_Nombre: partida_nombre,
        pt_CatalogoConceptos: proyecto[0].pr_CatalogoConceptos,
    }

    const query = 'INSERT INTO PARTIDA SET ?';
    await pool.query(query, [newPartida]);

    //Ahora se va a pasar el id de la partida y el id del proyecto
    //console.log(newPartida.pt_ID);
    res.redirect('/proyectos/crear-conceptos/'+newPartida.pt_ID + '/' + pr_id);
});

//Crear Catalogo de Conceptos
router.get('/crear-conceptos/:pt_id/:pr_id', isLoggedIn, async (req, res) => {
    const {pt_id,pr_id} = req.params;
    res.render('proyectos/crear-conceptos', {pt_id, pr_id, layout: 'logged-layout'});
});

router.post('/crear-conceptos/:pt_id/:pr_id', isLoggedIn, async (req, res) => {
    const {pt_id, pr_id} = req.params;
    const {nombre_concepto, unidad_concepto, cantidad_concepto,precio_concepto } = req.body;

    const genClave = async (cp_ID) => {
        //Obtener nombre de la partida
        const partida = await pool.query('SELECT * FROM PARTIDA WHERE pt_ID = ?', [pt_id]);
        const nombrePartida = partida[0].pt_Nombre;
        const primera_letra = nombrePartida.charAt(0);
        const segunda_letra = nombrePartida.charAt(1);

        return primera_letra + segunda_letra + cp_ID;
    }

    const cp_ID = genID();

    const cp_Clave = genClave(cp_ID);

    const newConcepto = {
        cp_ID: cp_ID,
        cp_Clave: await cp_Clave,
        cp_Nombre: nombre_concepto,
        cp_Unidad: unidad_concepto,
        cp_Cantidad: cantidad_concepto,
        cp_PrecioUnitario: precio_concepto,
        cp_Importe: cantidad_concepto * precio_concepto,
        cp_Partida: pt_id,
    }

    const query = 'INSERT INTO CONCEPTO SET ?';
    await pool.query(query, [newConcepto]);
    console.log(pr_id);
    res.redirect('/proyectos/crear-conceptos/'+pt_id+'/'+pr_id);
});

//Ver Partidas
router.get('/partidas-vista/:pr_id', isLoggedIn, async (req, res) => {
    const {pr_id} = req.params;
    const proyecto = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [pr_id]);

    //Obtener partidas
    const partidas = await pool.query('SELECT * FROM PARTIDA WHERE pt_CatalogoConceptos = ?', [proyecto[0].pr_CatalogoConceptos]);
    
    res.render('pages/partidas-vista', {partidas, proyecto: proyecto[0], layout: 'logged-layout'});
});

//Ver Conceptos de una partida
router.get('/catalogo-conceptos/:pt_id', isLoggedIn, async (req, res) => {
    const {pt_id} = req.params;
    const partida = await pool.query('SELECT * FROM PARTIDA WHERE pt_ID = ?', [pt_id]);
    const conceptos = await pool.query('SELECT * FROM CONCEPTO WHERE cp_Partida = ?', [pt_id]);

    res.render('proyectos/catalogo-conceptos', {conceptos, partida: partida[0], layout: 'logged-layout'});
});

module.exports = router;
module.exports = genID;
module.exports = dateFormat;