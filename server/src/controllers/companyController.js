const companyService = require('../services/companyService');
const { validateCreateCompany, validateUpdateCompany } = require('../validations/companyValidation');

async function getCompanies(req, res) {
  try {
    const companies = await companyService.getAllCompanies();
    return res.json({ companies });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch companies', error: error.message });
  }
}

async function getCompanyById(req, res) {
  try {
    const company = await companyService.getCompanyById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    return res.json({ company });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch company', error: error.message });
  }
}

async function createCompany(req, res) {
  const { errors, isValid } = validateCreateCompany(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const company = await companyService.createCompany(req.body, req.user.id);
    return res.status(201).json({ company });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create company', error: error.message });
  }
}

async function updateCompany(req, res) {
  const { errors, isValid } = validateUpdateCompany(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingCompany = await companyService.getCompanyById(req.params.id);
    if (!existingCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const company = await companyService.updateCompany(req.params.id, req.body);
    return res.json({ company });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update company', error: error.message });
  }
}

async function deleteCompany(req, res) {
  try {
    const existingCompany = await companyService.getCompanyById(req.params.id);
    if (!existingCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await companyService.deleteCompany(req.params.id);
    return res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete company', error: error.message });
  }
}

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};
