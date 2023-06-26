const express = require('express');
const { isLoggedIn } = require('../lib/auth');
const router = express.Router();
const fs = require('fs');

const pool = require('../database');

router.get('/', isLoggedIn, async (req, res) => {

    //Obtenemos el usuario que está logueado
    const user = req.user;

    //Obtenemos los documentos del usuario
    //Creamos la carpeta del usuario si no existe
    try {
        if (!fs.existsSync(`./src/public/user-docs/${user.us_ID}`)) {
            fs.mkdirSync(`./src/public/user-docs/${user.us_ID}`);
        }

        //Obtenemos los archivos de la carpeta del usuario
        const files = fs.readdirSync(`./src/public/user-docs/${user.us_ID}`);
        //console.log(files);

        //Por cada archivo obtenemos su información
        const filesInfo = files.map(file => {
            const stats = fs.statSync(`./src/public/user-docs/${user.us_ID}/${file}`);
            const fileSizeInBytes = stats.size;
            const fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
            const fileDir = `./user-docs/${user.us_ID}/${file}`;
            return {
                name: file,
                size: fileSizeInMegabytes.toFixed(2),
                dir: fileDir
            }
        });

        //Renderizamos la vista de documentos
        res.render('docs/index-docs', { 
            user,
            files: filesInfo,
            layout: 'logged-layout' 
        });

    } catch (err) {
        console.error(err);
    }
});

//Documentos del proyecto
router.get('/project/:pr_id', isLoggedIn, async (req, res) => {

    const { pr_id } = req.params;
    //Obtener el proyecto
    const proyecto = await pool.query('SELECT * FROM PROYECTO WHERE pr_ID = ?', [pr_id]);

    //Creamos la carpeta del proyecto si no existe
    try {
        if (!fs.existsSync(`./src/public/project-docs/${pr_id}`)) {
            fs.mkdirSync(`./src/public/project-docs/${pr_id}`);
        }

        //Obtenemos los archivos de la carpeta del usuario
        const files = fs.readdirSync(`./src/public/project-docs/${pr_id}`);
        //console.log(files);

        //Por cada archivo obtenemos su información
        const filesInfo = files.map(file => {
            const stats = fs.statSync(`./src/public/project-docs/${pr_id}/${file}`);
            const fileSizeInBytes = stats.size;
            const fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
            const fileDir = `./project-docs/${pr_id}/${file}`;
            return {
                name: file,
                size: fileSizeInMegabytes.toFixed(2),
                dir: fileDir
            }
        });

        //Renderizamos la vista de documentos
        res.render('docs/project-docs', { 
            proyecto: proyecto[0],
            files: filesInfo,
            layout: 'logged-layout' 
        });

    } catch (err) {
        console.error(err);
    }
});

module.exports = router;