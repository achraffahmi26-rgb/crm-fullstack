const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/assignees', userController.getAssignees);

router.use(requireAdmin);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id/password', userController.resetUserPassword);
router.delete('/:id', (req, res) => {
  res.status(405).json({ message: 'User deletion is disabled. Please deactivate the account instead.' });
});

module.exports = router;
