const categoryService = require('../services/categoryService');
const { validateCreateCategory, validateUpdateCategory } = require('../validations/categoryValidation');

async function getCategories(req, res) {
  try {
    const categories = await categoryService.getAllCategories();
    return res.json({ categories });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch categories', error: error.message });
  }
}

async function getCategoryById(req, res) {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.json({ category });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch category', error: error.message });
  }
}

async function createCategory(req, res) {
  const { errors, isValid } = validateCreateCategory(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const nameExists = await categoryService.getCategoryByName(req.body.name);
    if (nameExists) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const category = await categoryService.createCategory(req.body);
    return res.status(201).json({ category });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create category', error: error.message });
  }
}

async function updateCategory(req, res) {
  const { errors, isValid } = validateUpdateCategory(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingCategory = await categoryService.getCategoryById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (req.body.name !== undefined) {
      const nameExists = await categoryService.getCategoryByName(req.body.name, req.params.id);
      if (nameExists) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
    }

    const category = await categoryService.updateCategory(req.params.id, req.body);
    return res.json({ category });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update category', error: error.message });
  }
}

async function deleteCategory(req, res) {
  try {
    const existingCategory = await categoryService.getCategoryById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await categoryService.deleteCategory(req.params.id);
    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete category', error: error.message });
  }
}

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
