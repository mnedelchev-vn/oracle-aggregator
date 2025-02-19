require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */

//default to mnemonic for testing
const testKey=
module.exports = {
    defaultNetwork: 'hardhat',
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    solidity: {
        compilers:[
            {
              version: '0.8.28',
              settings: {
                  optimizer: {
                      enabled: true,
                      runs: 200,
                  }
              }
            },
            {
                version: '0.7.6',
                settings: {
                    viaIR: true,
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    }
                }
            }
        ],
        overrides: {
          "contracts/UniswapOracleHelper.sol": {
              version: '0.7.6',
              settings: { }
          },
          "@uniswap/v3-core/contracts/libraries/TickMath.sol": {
              version: '0.7.6',
              settings: { }
          },
          "@uniswap/v3-core/contracts/libraries/FullMath.sol": {
              version: '0.7.6',
              settings: { }
          }
        }
    },
    networks: {
        hardhat: {
            forking: {
                url: process.env.MAINNET_NODE
            }
        }
    },
    mocha: {
        timeout: 100000000
    }
};