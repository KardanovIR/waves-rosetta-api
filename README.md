# Waves Rosetta API

Waves node with Rosetta API compatible middleware

## Overview 
This middleware implements [Rosetta API](https://rosetta-api.com) specifications for Waves blockchain.

The docker image inherits settings from [Waves Node Docker Image](https://github.com/wavesplatform/Waves/blob/master/docker/README.md).

## Usage

### Build docker image

The simplest way to build an image is to run the following command:

```sh
docker build . -t waves-rosetta-api
```

Additional properties are described [here](https://github.com/wavesplatform/Waves/blob/master/docker/README.md#building-docker-image).

### Running docker image

```sh
docker run -v /waves-data:/var/lib/waves -v waves-config:/etc/waves -p 6869:6869 -p 6862:6862 -p 8080:8080 -e JAVA_OPTS="-Dwaves.rest-api.enable=yes -Dwaves.rest-api.bind-address=0.0.0.0 -Dwaves.rest-api.port=6869  -Dwaves.wallet.password=myWalletSuperPassword" -e WAVES_NETWORK=stagenet -ti waves-rosetta-api

```

### Calling API

API call examples are shown [here](https://www.getpostman.com/collections/f09f5a7b80c6a357b5c2).

### Configuration

Waves node image configuration process is described [here](https://github.com/wavesplatform/Waves/blob/master/docker/README.md#environment-variables)

Middleware configuration is stored in `.env` file 

## Tests

Use [Rosetta CLI](https://github.com/coinbase/rosetta-cli) to run tests for this middleware.

## Known issues
 
- Transaction fees are counted as one `Operation` because of lack of data about sponsored asseets
- `/construction/payloads` requires an additional field `public_key` to generate a transaction
- Does not support assets issued on the Waves blockchain
- Supports only one signature in Construction API