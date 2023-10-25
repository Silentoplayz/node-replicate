import fetch from 'chiaki';

/**
 * NodeReplicate class for interacting with the Replicate API.
 */
class NodeReplicate {
  /**
   * Constructs a new NodeReplicate instance.
   * @param {Object} [options={}] - Configuration options.
   * @param {string} [options.baseUrl] - Base URL for the Replicate API.
   * @param {Function} [options.fetch] - Fetch function to use.
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://replicate.com/api/models';
    this.fetch = options.fetch || fetch;
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
      await this.delay(250);
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
    const response = await this.fetch(url);
    return JSON.parse(response.body).prediction;
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

    const response = await this.fetch(options);
    return JSON.parse(response.body);
  }

  /**
   * Introduces a delay.
   * @param {number} ms - The number of milliseconds to delay.
   * @returns {Promise<void>} - Resolves after the specified delay.
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default NodeReplicate;
