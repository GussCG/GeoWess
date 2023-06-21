//const pool = require('../database');

// const getDataColors = data => {
//     const colors = [
//         'rgb(255, 99, 132)',
//         'rgb(255, 159, 64)',
//         'rgb(255, 205, 86)',
//         'rgb(75, 192, 192)',
//         'rgb(216, 184, 255)',
//         'rgb(153, 102, 255)',
//         'rgb(192, 255, 184)',
//         'rgb(255, 153, 153)',
//         'rgb(255, 153, 255)',
//         'rgb(255, 255, 153)',
//         'rgb(110, 94, 78)',
//     ];

//     return data.map((_, index) => colors[index]);
// }

// const printCharts = () => {
//     renderFaseChart();
// }

// const renderFaseChart = async () => {
//     //Se llene la gráfica con las fases del proyecto
//     //Obtener las fases del proyecto
//     //Primero obtengo el proyecto
//     const {pr_id} = req.params;
//     //Obtengo las fases del proyecto
//     const fases = await pool.query('SELECT * FROM FASE_PROYECTO WHERE fp_Proyecto = ?', [pr_id]);

//     console.log(fases);

//     //Obtener las fases únicas
//     const uniqueFase = [...new Set(fases.map(fase => fase.fp_Nombre))].map(nombre => {
//         return {
//             fp_Nombre: nombre,
//             fp_PorcentajeAvance: fases.find(fase => fase.fp_Nombre === nombre).fp_PorcentajeAvance
//         }
//     });

//     //Se crea la gráfica de fases
//     const data = {
//         labels: uniqueFase.map(fase => fase.fp_Nombre),
//         datasets: [{
//             label: 'Porcentaje de avance',
//             data: uniqueFase.map(fase => fase.fp_PorcentajeAvance),
//             backgroundColor: getDataColors(uniqueFase.map(fase => fase.fp_Nombre)),
//             hoverOffset: 4
//         }]
//     };

//     const options = {
//         responsive: true,
//         plugins: {
//             legend: { position: 'bottom' },
//             title: {
//                 display: true,
//                 text: 'Fases por Porcentaje de Avance'
//             }
//         }
//     }

//     new Chart('grafica',{type: 'doughnut', data, options});
// }

//const pool = require('../database');

const printCharts = () => {
    renderModelChart();
}

const renderModelChart = () => {
    const data ={
        labels: ['Fase 1', 'Fase 2', 'Fase 3', 'Fase 4'],
        datasets: [{
            data: [74, 10, 90, 50],
        }]
    }

    new Chart('grafica', {type: 'doughnut', data});
}

printCharts();

console.log('Se cargó la gráfica');
printCharts();