export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  return res.status(status).json({
    error: err.code || 'error_interno',
    message: err.message || 'Ocurrió un error no controlado'
  });
}

export function notFound(_req, res) {
  return res.status(404).json({ error: 'no_encontrado' });
}
