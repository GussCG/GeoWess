const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'GeoWess.Contact@gmail.com',
        pass: 'ohsewyjdwzeznlqq'
    },
});

transporter.verify().then(() => {
    console.log('Ready for send emails');
});

module.exports = transporter;