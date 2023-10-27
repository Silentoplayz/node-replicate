# node-replicate

A modernized Node.js client for [Replicate](https://replicate.com).

```js
import NodeReplicate from "node-replicate";
```

```js
const model = "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf";
const input = { prompt: "an astronaut riding on a horse" };

const replicate = new NodeReplicate();
await replicate.run(model, input);
```

<img src='https://pbxt.replicate.delivery/fbxm5ZezYLte4o5MgoqtKzv7Bb2bB8eOkiUoTfhRXq196TDOC/out-0.png' width='100%'>

## Introduction

[Replicate](https://replicate.com) is an online platform that allows users to run machine learning models with a few lines of code in the cloud, without needing to understand how machine learning works. This package provides a revamped client for Replicate's Anonymous API, enabling users to effortlessly run models like [Stable Diffusion](https://replicate.com/stability-ai/stable-diffusion), [Whisper](https://replicate.com/openai/whisper), and other advanced models with a more intuitive and modernized API.

## Features

* Anonymous API with enhanced structure for usability 👻.
* Modular and extensible design 🛠️.
* Improved error handling and validation 🛡️.

## Installation

Install with npm.

```sh
npm i node-replicate
```

## Usage

To run a model, instantiate the `NodeReplicate` class and use its methods.

```js
const model = "owner/model:version";
const input = { prompt: "an astronaut riding on a horse" };

const replicate = new NodeReplicate();
await replicate.run(model, input);
```

Monitor the status of pending predictions with the `create` and `get` methods.

```js
let prediction = await replicate.create(model, input);

while (prediction.status !== "succeeded") {
  console.log(prediction.status);
  prediction = await replicate.get(prediction);
}
```

## Contributing

Have suggestions or improvements? Create a [pull request](https://github.com/Silentoplayz/node-replicate/pulls) or open an [issue](https://github.com/Silentoplayz/node-replicate/issues).
