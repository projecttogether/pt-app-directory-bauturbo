require('dotenv').config();

module.exports = {
  CONTACT_API_URL: process.env.CONTACT_API_URL || "https://mailersend-proxy.bauturbo.workers.dev"
};
