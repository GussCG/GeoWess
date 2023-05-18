const express = require('express');
const router = express.Router();

const pool = require('../database');

router.get('/crear-proyecto', (req, res) => {
    res.render('pages/crear-proyecto');
});

router.post('/crear-proyecto', async (req, res) =>{
    const {nombre_proyecto, fechainicio_proyecto, fechafin_proyecto, direccion_proyecto, ciudad_proyecto, estado_proyecto, pais_proyecto, cp_proyecto} = req.body;

    let pr_Ubicacion = direccion_proyecto + ', ' + ciudad_proyecto + ', ' + estado_proyecto + ', ' + pais_proyecto + ', ' + cp_proyecto;

    //Generar ID random de 6 numeros
    let genID = () => {
        let id = '';
        for(let i = 0; i < 6; i++){
            id += Math.floor(Math.random() * 10);
        }
        return id;
    }

    const newProyect = {
        pr_ID: genID(),
        pr_Nombre: nombre_proyecto,
        pr_FechaInicio: fechainicio_proyecto,
        pr_FechaFin: fechafin_proyecto,
        pr_Status: 0, // 0 -> En proceso, 1 -> Terminado
        pr_CostoTotal: 0.0,
        pr_Ubicacion,
        pr_Contratante: null,
        pr_CatalogoConceptos: null,
    }

    let query = 'INSERT INTO PROYECTO SET ?';
    await pool.query(query, [newProyect]);

    res.send('Recibido');
})

router.get('/', async (req, res) => {
    const proyectos = await pool.query('SELECT * FROM PROYECTO');

    // Formatear fechas
    let dateFormat = (date) => {
        let fecha = new Date(date);
        let dia = fecha.getDate();
        let mes = fecha.getMonth() + 1;
        let anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }

    proyectos.forEach(proyecto => {
        proyecto.pr_FechaInicio = dateFormat(proyecto.pr_FechaInicio);
        proyecto.pr_FechaFin = dateFormat(proyecto.pr_FechaFin);
    });

    res.render('pages/proyectos', {proyectos});
});

module.exports = router;