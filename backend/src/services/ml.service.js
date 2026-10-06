const axios = require('axios');

/**
 * Calls the Flask microservice serving the one Decision Tree classifier.
 * Fails soft (returns null) so a temporarily-down ML service never blocks
 * sensor ingestion - the dashboard just shows no classification until it
 * comes back.
 */
async function predictProductivity(features) {
  const baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
  try {
    const { data } = await axios.post(`${baseUrl}/predict`, features, { timeout: 15000 });
    return data; // { classification, confidence, featureImportances }
  } catch (err) {
    console.error('[ml.service] prediction failed:', err.message);
    return null;
  }
}

module.exports = { predictProductivity };
