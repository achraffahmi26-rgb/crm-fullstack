const taskService = require('../services/taskService');
const { validateCreateTask, validateUpdateTask } = require('../validations/taskValidation');

async function getTasks(req, res) {
  try {
    const tasks = await taskService.getAllTasks();
    return res.json({ tasks });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch tasks', error: error.message });
  }
}

async function getTaskById(req, res) {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.json({ task });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch task', error: error.message });
  }
}

async function createTask(req, res) {
  const { errors, isValid } = validateCreateTask(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    if (req.body.assigned_to !== undefined) {
      const userExists = await taskService.userExists(req.body.assigned_to);
      if (!userExists) {
        return res.status(400).json({ message: 'assigned_to does not exist' });
      }
    }

    const task = await taskService.createTask(req.body, req.user.id);
    return res.status(201).json({ task });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create task', error: error.message });
  }
}

async function updateTask(req, res) {
  const { errors, isValid } = validateUpdateTask(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingTask = await taskService.getTaskById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.body.assigned_to !== undefined) {
      const userExists = await taskService.userExists(req.body.assigned_to);
      if (!userExists) {
        return res.status(400).json({ message: 'assigned_to does not exist' });
      }
    }

    const task = await taskService.updateTask(req.params.id, req.body);
    return res.json({ task });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update task', error: error.message });
  }
}

async function deleteTask(req, res) {
  try {
    const existingTask = await taskService.getTaskById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await taskService.deleteTask(req.params.id);
    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete task', error: error.message });
  }
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
