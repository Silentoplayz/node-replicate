import fetch from 'node-fetch';

/**
 * NodeReplicate class for interacting with the Replicate API.
 */
class NodeReplicate {
  /**
   * Constructs a new NodeReplicate instance.
   * @param {Object} [options={}] - Configuration options.
   * @param {string} [options.baseUrl] - Base URL for the Replicate API.
   * @param {Function} [options.fetch] - Fetch function to use.
   * @param {number} [options.timeout] - Custom timeout for the delay function in milliseconds.
   * @param {number} [options.maxRetries] - Maximum number of retries for failed API requests.
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://replicate.com/api/models';
    this.fetch = options.fetch || fetch;
    this.timeout = options.timeout || 250;
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * Runs a model and waits for its output.
   * @param {string} model - The model identifier in the format "{path}:{version}".
   * @param {Object} inputs - Model inputs.
   * @returns {Promise<Object>} - Resolves with the output of running the model.
   */
  async run(model, inputs) {
    let prediction = await this.create(model, inputs);
    const validStatuses = ['canceled', 'succeeded', 'failed'];

    while (!validStatuses.includes(prediction.status)) {
      await this.delay(this.timeout);
      prediction = await this.get(prediction);
    }

    return prediction.output;
  }

  /**
   * Retrieves a prediction's details.
   * @param {Object} prediction - The prediction object.
   * @returns {Promise<Object>} - Resolves with the prediction details.
   */
  async get(prediction) {
    const url = `${this.baseUrl}${prediction.version.model.absolute_url}/versions/${prediction.version_id}/predictions/${prediction.uuid}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    return data.prediction;
  }

  /**
   * Creates a new prediction.
   * @param {string} model - The model identifier in the format "{path}:{version}".
   * @param {Object} inputs - Model inputs.
   * @returns {Promise<Object>} - Resolves with the created prediction details.
   */
  async create(model, inputs) {
    const [path, version] = model.split(':');
    const options = {
      hostname: 'replicate.com',
      path: `/api/models/${path}/versions/${version}/predictions`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ inputs }),
    };

    const response = await this.fetchWithRetry(`${this.baseUrl}/${path}/versions/${version}/predictions`, options);
    const data = await response.json();
    return data;
  }

  /**
   * Introduces a delay.
   * @param {number} ms - The number of milliseconds to delay.
   * @returns {Promise<void>} - Resolves after the specified delay.
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
    * Fetch with a retry mechanism for failed API requests.
    * @param {string} url - The URL to fetch.
    * @param {Object} [options] - Fetch options.
    * @returns {Promise<Response>} - Resolves with the fetch response.
    */
    async fetchWithRetry(url, options = {}) {
    for (let i = 0; i < this.maxRetries; i++) {
    try {
    const response = await this.fetch(url, options);
    if (response.ok) return response;
    } catch (error) {
    if (i === this.maxRetries - 1) throw error;
    }
    await this.delay(this.timeout);
    }
    throw new Error('Max retries reached for API request.');
  }
}

export default NodeReplicate;
