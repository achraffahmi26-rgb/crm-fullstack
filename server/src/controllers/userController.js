const userService = require('../services/userService');
const { validateCreateUser, validateUpdateUser, validateResetPassword } = require('../validations/userValidation');

async function getUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch users', error: error.message });
  }
}

async function getAssignees(req, res) {
  try {
    const users = await userService.getAssignableUsers();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch assignees', error: error.message });
  }
}

async function getUserById(req, res) {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch user', error: error.message });
  }
}

async function createUser(req, res) {
  const { errors, isValid } = validateCreateUser(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const roleExists = await userService.roleExists(req.body.role_id);
    if (!roleExists) {
      return res.status(400).json({ message: 'role_id does not exist' });
    }

    const emailInUse = await userService.emailExists(req.body.email);
    if (emailInUse) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await userService.createUser(req.body);
    return res.status(201).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create user', error: error.message });
  }
}

async function updateUser(req, res) {
  const { errors, isValid } = validateUpdateUser(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingUser = await userService.getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetUserId = Number(req.params.id);
    const currentUserId = Number(req.user.id);

    if (targetUserId === currentUserId && req.body.status === 'Inactive') {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    if (req.body.role_id !== undefined) {
      const roleExists = await userService.roleExists(req.body.role_id);
      if (!roleExists) {
        return res.status(400).json({ message: 'role_id does not exist' });
      }

      if (targetUserId === currentUserId && Number(req.body.role_id) !== Number(existingUser.role_id)) {
        return res.status(400).json({ message: 'You cannot change your own role' });
      }
    }

    if (req.body.email !== undefined) {
      const emailInUse = await userService.emailExists(req.body.email, parseInt(req.params.id, 10));
      if (emailInUse) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }

    const user = await userService.updateUser(req.params.id, req.body);
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update user', error: error.message });
  }
}

async function resetUserPassword(req, res) {
  const { errors, isValid } = validateResetPassword(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingUser = await userService.getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userService.resetUserPassword(req.params.id, req.body.password);
    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to reset password', error: error.message });
  }
}


module.exports = {
  getUsers,
  getAssignees,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
};
