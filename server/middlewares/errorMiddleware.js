function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Recurso não encontrado'
  });
}

function errorHandler(err, req, res, next) {
  console.error('ERRO:', err);
  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = statusCode < 500 && err.message ? err.message : 'Falha inesperada no servidor';

  res.status(statusCode).json({
    success: false,
    error: message
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
