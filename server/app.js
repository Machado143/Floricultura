const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();
const allowedOrigin = process.env.FRONTEND_URL;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: allowedOrigin || false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online'
  });
});

// Servir a pasta 'client' na raiz e sob o prefixo /client
app.use(express.static(path.join(__dirname, '../client')));
app.use('/client', express.static(path.join(__dirname, '../client')));

// Rota raiz redireciona para a tela de login
app.get('/', (req, res) => {
  res.redirect('/client/pages/login/index.html');
});

app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
