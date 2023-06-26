// Función para crear las estimaciones de una obra
const pool = require('./database');

const estimaciones = async () => {
	const { cp_ID, cp_Nombre, cp_Importe } = req.body;
	//Obtenemos los nombres e importes de los conceptos
	const conceptos = await pool.query('select * from CONCEPTO');

	console.log(conceptos);

	//Obtenemos los conceptos únicos
	const uniqueConcepto = [...new Set(conceptos.map(concepto => concepto.cp_Nombre))].map(cp_Nombre => {
		return {
			cp_Nombre: cp_Nombre,
			cp_Importe: conceptos.find(concepto => concepto.cp_Nombre === cp_Nombre).cp_Importe
		}
	});

	console.log(uniqueConcepto);

	

}