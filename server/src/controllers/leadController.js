const leadService = require('../services/leadService');
const { validateCreateLead, validateUpdateLead } = require('../validations/leadValidation');

async function getLeads(req, res) {
  try {
    const leads = await leadService.getAllLeads(req.user);
    return res.json({ leads });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch leads', error: error.message });
  }
}

async function getLeadById(req, res) {
  try {
    const lead = await leadService.getLeadById(req.params.id, req.user);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    return res.json({ lead });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch lead', error: error.message });
  }
}

async function createLead(req, res) {
  const { errors, isValid } = validateCreateLead(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const companyExists = await leadService.companyExists(req.body.company_id);
    if (!companyExists) {
      return res.status(400).json({ message: 'company_id does not exist' });
    }

    if (leadService.isAdmin(req.user) && req.body.assigned_to !== undefined) {
      const assignedExists = await leadService.activeUserExists(req.body.assigned_to);
      if (!assignedExists) {
        return res.status(400).json({ message: 'assigned_to active user does not exist' });
      }
    }

    const lead = await leadService.createLead(req.body, req.user);
    return res.status(201).json({ lead });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create lead', error: error.message });
  }
}

async function updateLead(req, res) {
  const { errors, isValid } = validateUpdateLead(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingLead = await leadService.getLeadById(req.params.id, req.user);
    if (!existingLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (req.body.company_id !== undefined) {
      const companyExists = await leadService.companyExists(req.body.company_id);
      if (!companyExists) {
        return res.status(400).json({ message: 'company_id does not exist' });
      }
    }

    if (req.body.assigned_to !== undefined) {
      if (!leadService.isAdmin(req.user) && Number(req.body.assigned_to) !== Number(req.user.id)) {
        return res.status(403).json({ message: 'Employees cannot reassign leads' });
      }

      if (leadService.isAdmin(req.user)) {
        const assignedExists = await leadService.activeUserExists(req.body.assigned_to);
        if (!assignedExists) {
          return res.status(400).json({ message: 'assigned_to active user does not exist' });
        }
      }
    }

    const lead = await leadService.updateLead(req.params.id, req.body, req.user);
    return res.json({ lead });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update lead', error: error.message });
  }
}

async function deleteLead(req, res) {
  try {
    const existingLead = await leadService.getLeadById(req.params.id, req.user);
    if (!existingLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await leadService.deleteLead(req.params.id);
    return res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete lead', error: error.message });
  }
}

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
};
