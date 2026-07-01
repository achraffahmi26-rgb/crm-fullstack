const contactService = require('../services/contactService');
const { validateCreateContact, validateUpdateContact } = require('../validations/contactValidation');

async function getContacts(req, res) {
  try {
    const contacts = await contactService.getAllContacts();
    return res.json({ contacts });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch contacts', error: error.message });
  }
}

async function getContactById(req, res) {
  try {
    const contact = await contactService.getContactById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    return res.json({ contact });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch contact', error: error.message });
  }
}

async function createContact(req, res) {
  const { errors, isValid } = validateCreateContact(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const companyExists = await contactService.companyExists(req.body.company_id);
    if (!companyExists) {
      return res.status(400).json({ message: 'company_id does not exist' });
    }

    const contact = await contactService.createContact(req.body);
    return res.status(201).json({ contact });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create contact', error: error.message });
  }
}

async function updateContact(req, res) {
  const { errors, isValid } = validateUpdateContact(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingContact = await contactService.getContactById(req.params.id);
    if (!existingContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    if (req.body.company_id !== undefined) {
      const companyExists = await contactService.companyExists(req.body.company_id);
      if (!companyExists) {
        return res.status(400).json({ message: 'company_id does not exist' });
      }
    }

    const contact = await contactService.updateContact(req.params.id, req.body);
    return res.json({ contact });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update contact', error: error.message });
  }
}

async function deleteContact(req, res) {
  try {
    const existingContact = await contactService.getContactById(req.params.id);
    if (!existingContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    await contactService.deleteContact(req.params.id);
    return res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete contact', error: error.message });
  }
}

module.exports = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
};
