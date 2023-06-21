const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
    res.render('index', {layout: 'main'});
})

//Proyectos ejemplo
router.get('/proyectos-ejemplos', async (req, res) => {
    res.render('index/ejemplos', {layout: 'main'});
})

//Nosotros
router.get('/nosotros', async (req, res) => {
    res.render('index/nosotros', {layout: 'main'});
})


module.exports = router;