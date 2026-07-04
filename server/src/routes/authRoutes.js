const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', (req, res) => {
  res.status(403).json({
    status: 'error',
    message: 'Public registration is disabled. Please contact an administrator.',
  });
});
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
