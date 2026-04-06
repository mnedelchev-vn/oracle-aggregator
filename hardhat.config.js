require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
    solidity: "0.8.28",
    defaultNetwork: 'hardhat',
    solidity: {
        compilers: [
            {
                version: '0.8.28',
                settings: {
                    viaIR: true,
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
                live: false,
                saveDeployments: false,
                accounts: [],
                url: process.env.RPC_NODE
            }
        }
    },
    mocha: {
        timeout: 180000
    }
};