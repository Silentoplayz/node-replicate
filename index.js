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
   * @param {string} [options.apiKey] - API key for authentication (Optional).
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://replicate.com/api/models';
    this.fetch = options.fetch || fetch;
    this.timeout = options.timeout || 250;
    this.maxRetries = options.maxRetries || 3;
    this.apiKey = options.apiKey || null; // Support for API key
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
    if (prediction.status === 'failed') {
      throw new Error(`Prediction failed: ${prediction.error}`);
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
    console.log(`Fetching prediction details from URL: ${url}`); // Log the constructed URL
    const response = await this.fetchWithRetry(url);
    if (!response.ok) {
      throw new Error(`Failed to get prediction details: ${response.statusText}`);
    }
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
    const url = `${this.baseUrl}/${path}/versions/${version}/predictions`;
    console.log(`Creating prediction with URL: ${url}`); // Log the constructed URL
    const options = {
      hostname: 'replicate.com',
      path: `/api/models/${path}/versions/${version}/predictions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? {
          'Authorization': `Bearer ${this.apiKey}`
        } : {}),
      },
      body: JSON.stringify({
        inputs
      }),
    };
    const response = await this.fetchWithRetry(url, options);
    if (!response.ok) {
      throw new Error(`Failed to create prediction: ${response.statusText}`);
    }
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
        // Log the response status and message for failed attempts
        console.error(`Attempt ${i + 1}: ${response.status} - ${response.statusText}`);
        // If it's the last attempt, throw a detailed error
        if (i === this.maxRetries - 1) {
          const responseBody = await response.text();
          throw new Error(`Final attempt failed with status ${response.status}: ${responseBody}`);
        }
      } catch (error) {
        console.error(`Attempt ${i + 1}: ${error.message}`);
        if (i === this.maxRetries - 1) throw error;
      }
      await this.delay(this.timeout);
    }
    throw new Error('Max retries reached for API request.');
  }
  /**
   * Lists all available models.
   * @returns {Promise<Array<Object>>} - List of models.
   * @throws {Error} If the request fails.
   */
  async listModels() {
    const url = this.baseUrl;
    const response = await this.fetchWithRetry(url);
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.statusText}`);
    }
    return await response.json();
  }
  /**
   * Retrieves metadata for a specific model.
   * @param {string} modelPath - Path of the model.
   * @returns {Promise<Object>} - Model metadata.
   * @throws {Error} If the request fails.
   */
  async getModelMetadata(modelPath) {
    const url = `${this.baseUrl}/${modelPath}`;
    const response = await this.fetchWithRetry(url);
    if (!response.ok) {
      throw new Error(`Failed to get model metadata: ${response.statusText}`);
    }
    return await response.json();
  }
  /**
   * Cancels a prediction.
   * @param {Object} prediction - Prediction object.
   * @returns {Promise<Object>} - Response from the API.
   * @throws {Error} If the request fails.
   */
  async cancelPrediction(prediction) {
    const url = `${this.baseUrl}${prediction.version.model.absolute_url}/versions/${prediction.version_id}/predictions/${prediction.uuid}/cancel`;
    const options = {
      method: 'POST',
      headers: {
        ...(this.apiKey ? {
          'Authorization': `Bearer ${this.apiKey}`
        } : {}),
      },
    };
    const response = await this.fetchWithRetry(url, options);
    if (!response.ok) {
      throw new Error(`Failed to cancel prediction: ${response.statusText}`);
    }
    return await response.json();
  }
  /**
   * Checks the status of a prediction.
   * @param {Object} prediction - Prediction object.
   * @returns {Promise<string>} - Status of the prediction.
   */
  async checkStatus(prediction) {
    const details = await this.get(prediction);
    return details.status;
  }
}
export default NodeReplicate;
