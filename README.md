# Waves Rosetta API

Waves node with Rosetta API compatible middleware

## Overview 
This middleware implements [Rosetta API](https://rosetta-api.com) specifications for Waves blockchain.

The docker image inherits settings from [Waves Node Docker Image](https://github.com/wavesplatform/node-docker-image).

## Usage

### Build docker image

```sh
docker build . -t waves-rosetta-api
``` 

### Running docker image

```sh
docker run --name waves-rosetta -d -v  $(realpath Log):/data/Log -v $(realpath Chain):/data/Chain -v $(realpath rosetta-config.json):/data/rosetta-config.json -p 9090:8080 waves-rosetta-api:latest
```

### Configuration



## Tests

Use [Rosetta CLI](https://github.com/coinbase/rosetta-cli) to run tests for this middleware.

## Known issues
 
- Transaction fees are counted as one `Operation` because of lack of data about sponsored asseets
- `/construction/payloads` requires an additional field `public_key` to generate a transaction
- Does not support assets issued on the Waves blockchain
- Supports only one signature in Construction API