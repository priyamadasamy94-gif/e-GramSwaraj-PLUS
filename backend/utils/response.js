function ok(res, data, message = 'OK', status = 200, meta) {
  const body = { success: true, data, message };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}
const created = (res, data, message = 'Created successfully') => ok(res, data, message, 201);
module.exports = { ok, created };
