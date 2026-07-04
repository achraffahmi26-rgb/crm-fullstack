const customerService = require('../services/customerService');
const { validateCreateCustomer, validateUpdateCustomer } = require('../validations/customerValidation');

async function getCustomers(req, res) {
  try {
    const customers = await customerService.getAllCustomers(req.user);
    return res.json({ customers });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch customers', error: error.message });
  }
}

async function getCustomerById(req, res) {
  try {
    const customer = await customerService.getCustomerById(req.params.id, req.user);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    return res.json({ customer });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch customer', error: error.message });
  }
}

async function createCustomer(req, res) {
  const { errors, isValid } = validateCreateCustomer(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const companyExists = await customerService.companyExists(req.body.company_id);
    if (!companyExists) {
      return res.status(400).json({ message: 'company_id does not exist' });
    }

    if (customerService.isAdmin(req.user) && req.body.assigned_to !== undefined) {
      const assignedExists = await customerService.activeUserExists(req.body.assigned_to);
      if (!assignedExists) {
        return res.status(400).json({ message: 'assigned_to active user does not exist' });
      }
    }

    const customer = await customerService.createCustomer(req.body, req.user);
    return res.status(201).json({ customer });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create customer', error: error.message });
  }
}

async function updateCustomer(req, res) {
  const { errors, isValid } = validateUpdateCustomer(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingCustomer = await customerService.getCustomerById(req.params.id, req.user);
    if (!existingCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (req.body.company_id !== undefined) {
      const companyExists = await customerService.companyExists(req.body.company_id);
      if (!companyExists) {
        return res.status(400).json({ message: 'company_id does not exist' });
      }
    }

    if (req.body.assigned_to !== undefined) {
      if (!customerService.isAdmin(req.user) && Number(req.body.assigned_to) !== Number(req.user.id)) {
        return res.status(403).json({ message: 'Employees cannot reassign customers' });
      }

      if (customerService.isAdmin(req.user)) {
        const assignedExists = await customerService.activeUserExists(req.body.assigned_to);
        if (!assignedExists) {
          return res.status(400).json({ message: 'assigned_to active user does not exist' });
        }
      }
    }

    const customer = await customerService.updateCustomer(req.params.id, req.body, req.user);
    return res.json({ customer });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update customer', error: error.message });
  }
}

async function deleteCustomer(req, res) {
  try {
    const existingCustomer = await customerService.getCustomerById(req.params.id, req.user);
    if (!existingCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customerService.deleteCustomer(req.params.id);
    return res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete customer', error: error.message });
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
