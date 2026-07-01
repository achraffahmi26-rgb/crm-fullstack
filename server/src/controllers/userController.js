const userService = require('../services/userService');
const { validateCreateUser, validateUpdateUser } = require('../validations/userValidation');

async function getUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch users', error: error.message });
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

    if (req.body.role_id !== undefined) {
      const roleExists = await userService.roleExists(req.body.role_id);
      if (!roleExists) {
        return res.status(400).json({ message: 'role_id does not exist' });
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

async function deleteUser(req, res) {
  try {
    const existingUser = await userService.getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userService.deleteUser(req.params.id);
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete user', error: error.message });
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
