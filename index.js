import fetch from 'chiaki';

const BASE_URL = 'https://replicate.com/api/models';

export default {
  async run(model, inputs) {
    let prediction = await this.create(model, inputs);

    const validStatuses = ['canceled', 'succeeded', 'failed'];

    while (!validStatuses.includes(prediction.status)) {
      await this.delay(250);
      prediction = await this.get(prediction);
    }

    return prediction.output;
  },

  async get(prediction) {
    const url = `${BASE_URL}${prediction.version.model.absolute_url}/versions/${prediction.version_id}/predictions/${prediction.uuid}`;
    const response = await fetch(url);
    return JSON.parse(response.body).prediction;
  },

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

    const response = await fetch(options);
    return JSON.parse(response.body);
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
