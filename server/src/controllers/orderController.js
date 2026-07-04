const orderService = require('../services/orderService');
const { validateCreateOrder, validateUpdateOrder } = require('../validations/orderValidation');

async function getOrders(req, res) {
  try {
    const orders = await orderService.getAllOrders(req.user);
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch orders', error: error.message });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch order', error: error.message });
  }
}

async function createOrder(req, res) {
  const { errors, isValid } = validateCreateOrder(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const customerExists = await orderService.customerExists(req.body.customer_id);
    if (!customerExists) {
      return res.status(400).json({ message: 'customer_id does not exist' });
    }

    const customerAllowed = await orderService.canUseCustomer(req.body.customer_id, req.user);
    if (!customerAllowed) {
      return res.status(403).json({ message: 'You can only create orders for your own assigned customers' });
    }

    for (const item of req.body.items) {
      const productIsActive = await orderService.activeProductExists(item.product_id);
      if (!productIsActive) {
        return res.status(400).json({ message: `product_id ${item.product_id} must be an active product` });
      }
    }

    const order = await orderService.createOrder(req.body, req.user);
    return res.status(201).json({ order });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create order', error: error.message });
  }
}

async function updateOrder(req, res) {
  const { errors, isValid } = validateUpdateOrder(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingOrder = await orderService.getOrderById(req.params.id, req.user);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = await orderService.updateOrder(req.params.id, req.body, req.user);
    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update order', error: error.message });
  }
}

async function deleteOrder(req, res) {
  try {
    const existingOrder = await orderService.getOrderById(req.params.id, req.user);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await orderService.deleteOrder(req.params.id);
    return res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete order', error: error.message });
  }
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
