const dashboardService = require('../services/dashboardService');

async function getStats(req, res) {
  try {
    const stats = await dashboardService.getStats();
    return res.json({ stats });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch dashboard stats', error: error.message });
  }
}

async function getRevenue(req, res) {
  try {
    const revenue = await dashboardService.getRevenue();
    return res.json({ revenue });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch dashboard revenue', error: error.message });
  }
}

async function getRecentActivities(req, res) {
  try {
    const activities = await dashboardService.getRecentActivities();
    return res.json({ activities });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch recent activities', error: error.message });
  }
}

module.exports = {
  getStats,
  getRevenue,
  getRecentActivities,
};
