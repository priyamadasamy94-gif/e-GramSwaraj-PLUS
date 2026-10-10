const express = require('express');
const { protect, authorize } = require('../middleware/auth');

/** Standard REST routes with per-verb role restrictions. */
function crudRouter(ctrl, { read, create, update, remove }, extend) {
  const r = express.Router();
  r.use(protect);
  if (extend) extend(r); // custom routes first so they win over /:id
  r.get('/', authorize(read), ctrl.list);
  r.get('/:id', authorize(read), ctrl.get);
  r.post('/', authorize(create), ctrl.create);
  r.put('/:id', authorize(update), ctrl.update);
  r.patch('/:id', authorize(update), ctrl.update);
  r.delete('/:id', authorize(remove), ctrl.remove);
  return r;
}
module.exports = { crudRouter };
