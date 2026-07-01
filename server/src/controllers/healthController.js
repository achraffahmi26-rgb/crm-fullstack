function check(req, res) {
  res.json({
    status: 'success',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  check,
};
