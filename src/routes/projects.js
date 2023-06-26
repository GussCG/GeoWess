const express = require('express');
const router = express.Router();

const pool = require('../database');
const {
    isLoggedIn
} = require('../lib/auth');
const {
    render
} = require('timeago.js');
const {
    CanvasRenderService
} = require('chartjs-node-canvas');


const jsdom = require("jsdom");
const {
    JSDOM
} = jsdom;

//?FUNCIONES
//Generar ID random de 6 numeros
let genID = () => {
    let id = '';
    for (let i = 0; i < 6; i++) {
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

    if (mes < 10) {
        mes = '0' + mes;
    }

    if (dia < 10) {
        dia = '0' + dia;
    }

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

    if (inicio == fin) {
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

    if (fecha_ms < 0) {
        return 0;
    } else if (fecha_ms > total_ms) {
        return 100;
    }

    //let dias = Math.floor(fecha / dia_ms);
    //console.log("dias que han pasado: " + dias);

    //Calcular el porcentaje
    let porcentaje = (fecha_ms * 100) / total_ms;
    //console.log("porcentaje: " + porcentaje);

    return Math.round(porcentaje);
}

//Generar la clave del concepto
const genClave = (nombre, id) => {
    let clave = '';
    //Primeras dos letras del nombre de la partida
    clave += nombre[0] + nombre[1];
    //Juntar el id
    clave += id;

    return clave;
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

//?RUTAS
//!Proyectos index
router.get('/', async (req, res) => {
    //Obtener los proyectos del usuario
    const proyectos = await pool.query('SELECT * FROM PROYECTO WHERE pr_Usuario = ?', [req.user.us_ID]);

    proyectos.forEach(proyecto => {
        proyecto.pr_FechaInicio = dateFormat(proyecto.pr_FechaInicio);
        proyecto.pr_FechaFin = dateFormat(proyecto.pr_FechaFin);
    });

    //console.log(proyectos);

    res.render('proyectos/proyectos-index', {
        proyectos,
        layout: 'logged-layout'
    });
});

//!Crear-Proyecto
//Renderizar la vista
router.get('/crear-proyecto', isLoggedIn, async (req, res) => {
    res.render('proyectos/crear-proyecto', {
        layout: 'logged-layout'
    });
});

//Crear un proyecto
router.post('/crear-proyecto', isLoggedIn, async (req, res) => {
    const {
        nombre_proyecto,
        fechainicio_proyecto,
        fechafin_proyecto,
        direccion_proyecto,
        ciudad_proyecto,
        estado_proyecto,
        pais_proyecto,
        cp_proyecto
    } = req.body;
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
    await pool.query(query2, [{
        cc_ID: newProyect.pr_CatalogoConceptos
    }]);

    req.flash('success', "Se ha creado el proyecto");
    res.redirect('ver-proyecto/' + newProyect.pr_ID);
});

//! Ver-Proyecto
//Renderizar la vista
router.get('/ver-proyecto/:pr_id', isLoggedIn, async (req, res) => {
    const {
        pr_id
    } = req.params;
    const proyecto = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [pr_id]);
    const fases = await pool.query('SELECT * FROM FASE_PROYECTO WHERE fp_Proyecto = ?', [pr_id]);

    proyecto.forEach(proyecto => {
        fases.forEach(fase => {
            fase.fp_PorcentajeAvance = calcPorcentaje(fase);
            //Actualizar el porcentaje de avance de la fase en la base de datos
            let query = 'UPDATE FASE_PROYECTO SET fp_PorcentajeAvance = ? WHERE fp_ID = ?';
            pool.query(query, [fase.fp_PorcentajeAvance, fase.fp_ID]);
            //Si la fase ya termino, cambiar su status a 1
            if (fase.fp_PorcentajeAvance == 100) {
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
    // const canvasRenderService = new CanvasRenderService(800, 600, (ChartJS) => {
    //     console.log("Creando gráfica de fases");
    // });

    // console.log(proyecto);
    // console.log(fases);

    res.render('proyectos/ver-proyecto', {
        proyecto: proyecto[0],
        fases,
        layout: 'logged-layout'
    });
});

//! PARTIDA
//Renderizar la vista
router.get('/crear-partida/:pr_id', isLoggedIn, async (req, res) => {
    const {
        pr_id
    } = req.params;
    res.render('proyectos/crear-partida', {
        pr_id,
        layout: 'logged-layout'
    });
});

//Crear una partida
router.post('/crear-partida/:pr_id', isLoggedIn, async (req, res) => {
    const {
        pr_id
    } = req.params;
    const {
        partida_nombre
    } = req.body;

    //Obtener el catalogo de conceptos del proyecto
    const catalogo = await pool.query('SELECT pr_CatalogoConceptos FROM PROYECTO WHERE pr_ID = ?', [pr_id]);

    const newPartida = {
        pt_ID: genID(),
        pt_Nombre: partida_nombre,
        pt_CatalogoConceptos: catalogo[0].pr_CatalogoConceptos
    }

    let query = 'INSERT INTO PARTIDA SET ?';
    await pool.query(query, [newPartida]);

    req.flash('success', "Se ha creado la partida");
    res.redirect('../catalogo-conceptos/' + pr_id);
});

//Editar una partida
//Renderizar la vista
router.get('/editar-partida/:pt_id', isLoggedIn, async (req, res) => {
    const {
        pt_id
    } = req.params;

    //Obtener el id del catalogo de conceptos
    const catalogo = await pool.query('SELECT pt_CatalogoConceptos FROM PARTIDA WHERE pt_ID = ?', [pt_id]);

    //Obtener el proyecto
    const proyecto = await pool.query('SELECT * FROM PROYECTO WHERE pr_CatalogoConceptos = ?', [catalogo[0].pt_CatalogoConceptos]);

    //Obtener la partida
    const partida = await pool.query('SELECT * FROM PARTIDA WHERE pt_ID = ?', [pt_id]);

    res.render('proyectos/editar-partida', {
        proyecto: proyecto[0],
        partida: partida[0],
        layout: 'logged-layout'
    });
});

//Editar la partida
router.post('/editar-partida/:pt_id', isLoggedIn, async (req, res) => {
    const {
        pt_id
    } = req.params;

    const {
        pt_Nombre
    } = req.body;

    const newPartida = {
        pt_Nombre
    }

    let query = 'UPDATE PARTIDA SET ? WHERE pt_ID = ?';
    pool.query(query, [newPartida, pt_id]);

    //Obtener el id del catalogo de conceptos
    const catalogo = await pool.query('SELECT pt_CatalogoConceptos FROM PARTIDA WHERE pt_ID = ?', [pt_id]);

    //Obtener el id del proyecto
    const proyecto = await pool.query('SELECT pr_ID FROM PROYECTO WHERE pr_CatalogoConceptos = ?', [catalogo[0].pt_CatalogoConceptos]);

    req.flash('success', "Se ha editado la partida");
    res.redirect('../catalogo-conceptos/' + proyecto[0].pr_ID);
});

//Eliminar una partida
router.get('/eliminar-partida/:pt_id', isLoggedIn, async (req, res) => {
    const {
        pt_id
    } = req.params;

    //Obtener el id del catalogo de conceptos
    const catalogo = await pool.query('SELECT pt_CatalogoConceptos FROM PARTIDA WHERE pt_ID = ?', [pt_id]);

    //Obtener el id del proyecto
    const proyecto = await pool.query('SELECT pr_ID FROM PROYECTO WHERE pr_CatalogoConceptos = ?', [catalogo[0].pt_CatalogoConceptos]);

    //Eliminar la partida
    let query = 'DELETE FROM PARTIDA WHERE pt_ID = ?';
    pool.query(query, [pt_id]);

    req.flash('success', "Se ha eliminado la partida");
    res.redirect('../catalogo-conceptos/' + proyecto[0].pr_ID);
});

//! Catalogo de conceptos
//Renderizar la vista
router.get('/catalogo-conceptos/:pr_id', isLoggedIn, async (req, res) => {
    const {
        pr_id
    } = req.params;
    //Obtener el catalogo de conceptos del proyecto
    const catalogo = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [pr_id]);
    //Obtener las partidas del catalogo de conceptos
    //console.log(catalogo[0].pr_CatalogoConceptos);
    const partidas = await pool.query('SELECT * FROM PARTIDA WHERE pt_CatalogoConceptos = ?', [catalogo[0].pr_CatalogoConceptos]);

    console.log(partidas);
    res.render('proyectos/partidas-vista', {
        catalogo: catalogo[0],
        partidas,
        layout: 'logged-layout'
    });
});

//Ver conceptos de una partida
//Renderizar la vista
router.get('/ver-conceptos/:pt_id', isLoggedIn, async (req, res) => {
    const {
        pt_id
    } = req.params;
    const conceptos = await pool.query('SELECT * FROM CONCEPTO WHERE cp_Partida = ?', [pt_id]);
    const partida = await pool.query('SELECT * FROM PARTIDA WHERE pt_ID = ?', [pt_id]);

    //Obtener el id del proyecto
    const proyecto = await pool.query('SELECT pr_ID FROM PROYECTO WHERE pr_CatalogoConceptos = ?', [partida[0].pt_CatalogoConceptos]);

    res.render('proyectos/ver-conceptos', {
        proyecto: proyecto[0],
        conceptos,
        partida: partida[0],
        layout: 'logged-layout'
    });
});

//! Fases de proyecto
//Crear fases de proyecto
//Renderizar la vista
router.get('/crear-fase/:pr_id', isLoggedIn, async (req, res) => {
    const {
        pr_id
    } = req.params;

    //Obtener el proyecto
    const proyecto = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [pr_id]);

    //Formatear las fechas del proyecto
    proyecto[0].pr_FechaInicio = formatDateInput(proyecto[0].pr_FechaInicio);
    proyecto[0].pr_FechaFin = formatDateInput(proyecto[0].pr_FechaFin);

    res.render('proyectos/crear-fase', {
        pr_id,
        proyecto: proyecto[0],
        layout: 'logged-layout'
    });
});

//Crear una fase
router.post('/crear-fase/:pr_id', isLoggedIn, async (req, res) => {
    const {
        pr_id
    } = req.params;
    //console.log(pr_id);

    const {
        nombre_fase,
        fechaInicio_fase,
        fechaFin_fase
    } = req.body;

    const newFase = {
        fp_ID: genID(),
        fp_Nombre: nombre_fase,
        fp_FechaInicio: fechaInicio_fase,
        fp_FechaFin: fechaFin_fase,
        fp_Status: 0, // 0 -> En proceso, 1 -> Terminado
        fp_PorcentajeAvance: 0,
        fp_Proyecto: pr_id
    }

    //Formatear las fechas de la fase
    newFase.fp_FechaInicio = dateFormat(newFase.fp_FechaInicio);
    newFase.fp_FechaFin = dateFormat(newFase.fp_FechaFin);

    let query = 'INSERT INTO FASE_PROYECTO SET ?';
    await pool.query(query, [newFase]);

    req.flash('success', "Se ha creado la fase");
    res.redirect('/proyectos/ver-proyecto/' + pr_id);
});

//Editar una fase
//Renderizar la vista
router.get('/editar-fase/:fp_id', isLoggedIn, async (req, res) => {
    const {
        fp_id
    } = req.params;

    //Obtener el id del proyecto
    const proyecto = await pool.query('SELECT fp_Proyecto FROM FASE_PROYECTO WHERE fp_ID = ?', [fp_id]);

    //Obtener la fase
    const fase = await pool.query('SELECT * FROM FASE_PROYECTO WHERE fp_ID = ?', [fp_id]);

    //Formatear las fechas
    fase[0].fp_FechaInicio = formatDateInput(fase[0].fp_FechaInicio);
    fase[0].fp_FechaFin = formatDateInput(fase[0].fp_FechaFin);

    //console.log(fase);

    //Formatear las fechas del proyecto
    const proyecto_2 = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [proyecto[0].fp_Proyecto]);
    proyecto_2[0].pr_FechaInicio = formatDateInput(proyecto_2[0].pr_FechaInicio);
    proyecto_2[0].pr_FechaFin = formatDateInput(proyecto_2[0].pr_FechaFin);

    //console.log(proyecto_2);

    res.render('proyectos/editar-fase', {
        proyecto2: proyecto_2[0],
        proyecto: proyecto[0],
        fase: fase[0],
        layout: 'logged-layout'
    });
});

//Editar la fase
router.post('/editar-fase/:fp_id', isLoggedIn, async (req, res) => {
    const {
        fp_id
    } = req.params;

    const {
        fp_Nombre,
        fp_FechaInicio,
        fp_FechaFin
    } = req.body;

    //Revisar que las fechas esten en el rango del proyecto
    const fase_proyecto = await pool.query('SELECT * FROM FASE_PROYECTO WHERE fp_ID = ?', [fp_id]);
    const proyecto = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [fase_proyecto[0].fp_Proyecto]);

        const newFase = {
            fp_Nombre,
            fp_FechaInicio,
            fp_FechaFin
        }
    
        let query = 'UPDATE FASE_PROYECTO SET ? WHERE fp_ID = ?';
        pool.query(query, [newFase, fp_id]);
    
        req.flash('success', "Se ha editado la fase");
        res.redirect('/proyectos/ver-proyecto/' + fase_proyecto[0].fp_Proyecto);
});

//Eliminar una fase

//! Conceptos
//Crear Concepto
router.post('/crear-concepto/:pt_id', isLoggedIn, async (req, res) => {
    //Obtener el id de la partida
    const {
        pt_id
    } = req.params;

    const {
        cp_Nombre,
        cp_Unidad,
        cp_Cantidad,
        cp_PrecioUnitario,
    } = req.body;

    const newConcepto = {
        cp_ID: genID(),
        cp_Clave: '',
        cp_Nombre,
        cp_Unidad,
        cp_Cantidad,
        cp_PrecioUnitario,
        cp_Importe: cp_Cantidad * parseFloat(cp_PrecioUnitario),
        cp_Partida: pt_id
    }

    //Obtener el nombre de la partida
    const partida = await pool.query('SELECT pt_Nombre FROM PARTIDA WHERE pt_ID = ?', [pt_id]);

    //Generar la clave del concepto
    newConcepto.cp_Clave = genClave(partida[0].pt_Nombre, newConcepto.cp_ID);

    let query = 'INSERT INTO CONCEPTO SET ?';
    await pool.query(query, [newConcepto]);

    req.flash('success', "Se ha creado el concepto");
    res.redirect('/proyectos/ver-conceptos/' + pt_id);
});

//Editar concepto
//Renderizar la vista
router.get('/editar-concepto/:cp_id', isLoggedIn, async (req, res) => {
    const {
        cp_id
    } = req.params;

    //Obtener el id de la partida
    const partida_id = await pool.query('SELECT cp_Partida FROM CONCEPTO WHERE cp_ID = ?', [cp_id]);
    //Obtener la partida
    const partida = await pool.query('SELECT * FROM PARTIDA WHERE pt_ID = ?', [partida_id[0].cp_Partida]);

    //Obtener el catalogo de conceptos del proyecto
    const proyecto = await pool.query('SELECT * FROM PROYECTO WHERE pr_CatalogoConceptos = ?', [partida[0].pt_CatalogoConceptos]);

    //Obtener los conceptos de la partida
    const conceptos = await pool.query('SELECT * FROM CONCEPTO WHERE cp_Partida = ?', [partida_id[0].cp_Partida]);

    console.log(proyecto);

    //Con el id del concepto, escribir la informacion del concepto en el formulario de la misma pagina
    const concepto = await pool.query('SELECT * FROM CONCEPTO WHERE cp_ID = ?', [cp_id]);

    res.render('proyectos/editar-concepto', {
        proyecto: proyecto[0],
        partida: partida[0],
        concepto: concepto[0],
        conceptos,
        layout: 'logged-layout'
    });
});

//Editar el concepto
router.post('/editar-concepto/:cp_id', isLoggedIn, async (req, res) => {
    const {
        cp_id
    } = req.params;
    
    const {
        cp_Nombre,
        cp_Unidad,
        cp_Cantidad,
        cp_PrecioUnitario,
    } = req.body;

    //Obtener el id de la partida
    const partida_id = await pool.query('SELECT * FROM CONCEPTO WHERE cp_ID = ?', [cp_id]);

    //Nuevo concepto
    const newConcepto = {
        cp_Nombre,
        cp_Unidad,
        cp_Cantidad,
        cp_PrecioUnitario,
        cp_Importe: cp_Cantidad * parseFloat(cp_PrecioUnitario),
    }

    //Actualizar el concepto
    let query = 'UPDATE CONCEPTO SET ? WHERE cp_ID = ?';
    pool.query(query, [newConcepto, cp_id]);

    req.flash('success', "Se ha editado el concepto");
    res.redirect('/proyectos/ver-conceptos/' + partida_id[0].cp_Partida);
});


//Eliminar concepto
router.get('/eliminar-concepto/:cp_id', isLoggedIn, async (req, res) => {
    const {
        cp_id
    } = req.params;

    //Obtener el id de la partida
    const partida = await pool.query('SELECT cp_Partida FROM CONCEPTO WHERE cp_ID = ?', [cp_id]);

    //Eliminar el concepto
    let query = 'DELETE FROM CONCEPTO WHERE cp_ID = ?';
    pool.query(query, [cp_id]);

    req.flash('success', "Se ha eliminado el concepto");
    res.redirect('/proyectos/ver-conceptos/' + partida[0].cp_Partida);
});


module.exports = router;