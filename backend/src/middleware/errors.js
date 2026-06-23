export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? "Server error" : err.message;
  if (status === 500) console.error(err);
  res.status(status).json({ message });
}
