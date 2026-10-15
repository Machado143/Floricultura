const router = require('express').Router();

const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/rbacMiddleware');
const controller = require('../controllers/pedidoController');

router.use(authMiddleware);
router.get('/', checkRole(['ADMIN', 'GERENTE', 'VENDEDOR']), controller.list);
router.post('/', controller.create);
router.patch('/:id/cancelar', checkRole(['ADMIN', 'GERENTE']), controller.cancel);

module.exports = router;
