const bcrypt = require('bcryptjs');
const pool = require('../database');

const helpers = {};

helpers.encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const finalPass = await bcrypt.hash(password, salt);
    return finalPass;
};

helpers.matchPassword = async (password, savedPassword) => {
    try {
        return await bcrypt.compare(password, savedPassword);
    } catch (error) {
        console.log(error);
    }
};

helpers.getFases = async (proyecto) => {
    const fases = await pool.query('SELECT * FROM fases WHERE proyecto = ?', [proyecto]);
    return fases;
};

module.exports = helpers;