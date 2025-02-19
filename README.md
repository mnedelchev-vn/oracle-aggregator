# Oracle aggregator

### Project setup commands:
* ```npm install```
* ```npx hardhat test --network hardhat test/OracleAggregator.js```

### Before starting make sure to create .env file at the root of the project containing the following data:
```
    MAINNET_NODE=XYZ    // this has to be archieve EVM node, could use infura for example
```
    
### PURPOSE:
This is an upgradeable oracle aggregator which takes the price for a specific pair from Chainlink or Uniswap oracles. It is recommended to use method `priceChainlinkOverUniswap` instead of method `priceUniswapOverChainlink`, because Uniswap's oracle provides a TWAP of last 5 minutes meanwhile Chainlink is an decentralized oracle. There is no way to manipulate decentralized oracles as they do not rely on single markets and the includes mechanics such as VWAP, but Uniswap's TWAP could be potentially manipulated with large capital.

### CONTRACT METHODS:
* ```priceChainlinkOverUniswap``` - getting the price of tokenIn & tokenOut first from Chainlink and if the pair is not recognized in Chainlink then the method fallback to Uniswap.
* ```priceUniswapOverChainlink``` - getting the price of tokenIn & tokenOut first from Uniswap and if the pair is not recognized in Uniswap then the method fallback to Chainlink.