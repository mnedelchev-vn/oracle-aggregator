# Oracle aggregator

### Project setup commands:
* ```npm install```
* ```npx hardhat test --network hardhat test/OracleAggregator.js```

### Before starting make sure to create .env file at the root of the project containing the following data:
```
    MAINNET_NODE=XYZ
```
    
### PURPOSE:
This is an upgradeable oracle aggregator which takes the price for a specific pair from Chainlink or Uniswap oracles. By default Chainlink oracle has higher priority so it will look for the price there, but if a pair is not listed inside Chainlink the logic will fallback into using the Uniswap Oracle.

### CONTRACT METHODS:
* ```priceChainlinkOverUniswap``` - getting the price of tokenIn & tokenOut first from Chainlink and if the pair is not recognized in Chainlink fallback to look for a price from Uniswap.
* ```priceUniswapOverChainlink``` - getting the price of tokenIn & tokenOut first from Uniswap and if the pair is not recognized in Uniswap fallback to look for a price from Chainlink.