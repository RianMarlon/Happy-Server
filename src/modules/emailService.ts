import nodemailer from 'nodemailer';
import path from 'path';
import 'dotenv/config';

const hbs = require('nodemailer-express-handlebars');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_SERVICE_HOST,
  port: Number(process.env.MAIL_SERVICE_PORT),
  auth: {
    user: process.env.MAIL_SERVICE_USER,
    pass: process.env.MAIL_SERVICE_PASS
  }
});

transport.use('compile', hbs({
  viewEngine: {
    defaultLayout: undefined,
    partialsDir: path.resolve('./src/resources/emailTemplates/')
  },
  viewPath: path.resolve('./src/resources/emailTemplates/'),
  extName: '.html'
}));

export default transport;
