const inventoryService = require('../services/inventoryService');
const { validateCreateInventory, validateUpdateInventory } = require('../validations/inventoryValidation');

async function getInventory(req, res) {
  try {
    const inventory = await inventoryService.getAllInventory();
    return res.json({ inventory });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch inventory', error: error.message });
  }
}

async function getInventoryById(req, res) {
  try {
    const inventory = await inventoryService.getInventoryById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    return res.json({ inventory });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch inventory', error: error.message });
  }
}

async function getInventoryByProductId(req, res) {
  try {
    const inventory = await inventoryService.getInventoryByProductId(req.params.productId);
    if (!inventory) {
      return res.status(404).json({ message: 'No inventory record found for this product' });
    }
    return res.json({ inventory });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch inventory', error: error.message });
  }
}

async function createInventory(req, res) {
  const { errors, isValid } = validateCreateInventory(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const productExists = await inventoryService.productExists(req.body.product_id);
    if (!productExists) {
      return res.status(400).json({ message: 'product_id does not exist' });
    }

    const hasInventory = await inventoryService.productHasInventory(req.body.product_id);
    if (hasInventory) {
      return res.status(400).json({ message: 'This product already has an inventory record' });
    }

    const inventory = await inventoryService.createInventory(req.body);
    return res.status(201).json({ inventory });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create inventory', error: error.message });
  }
}

async function updateInventory(req, res) {
  const { errors, isValid } = validateUpdateInventory(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingInventory = await inventoryService.getInventoryById(req.params.id);
    if (!existingInventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    const inventory = await inventoryService.updateInventory(req.params.id, req.body);
    return res.json({ inventory });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update inventory', error: error.message });
  }
}

async function deleteInventory(req, res) {
  try {
    const existingInventory = await inventoryService.getInventoryById(req.params.id);
    if (!existingInventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    await inventoryService.deleteInventory(req.params.id);
    return res.json({ message: 'Inventory deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete inventory', error: error.message });
  }
}

module.exports = {
  getInventory,
  getInventoryById,
  getInventoryByProductId,
  createInventory,
  updateInventory,
  deleteInventory,
};
