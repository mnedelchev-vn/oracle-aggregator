// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
    const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
    const WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
    const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const XSGD = '0x70e8de73ce538da2beed35d14187f6959a8eca96';

    const Helper = await hre.ethers.getContractFactory("UniswapOracleHelper");
    const helper = await Helper.deploy();
    await helper.deployed();
    
    const OracleFactory = await hre.ethers.getContractFactory('OracleAggregator');
    const OracleContract = await upgrades.deployProxy(OracleFactory, [
        '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf', // CHAINLINK_FEED_REGISTRY
        '0x1F98431c8aD98523631AE4a59f267346ea31F984', // UNISWAP_FACTORY
        helper.address // UNISWAP_ORACLE_HELPER
    ], {kind: 'uups'});
    await OracleContract.deployed();
    console.log(OracleContract.address, 'OracleContract.address');

    // make sure the implementation initialize is also executed
    const oracleImplementationAddress = await upgrades.erc1967.getImplementationAddress(OracleContract.address);
    const OracleImplementationFactory = await ethers.getContractFactory("OracleAggregator");
    const OracleImplementation = await OracleImplementationFactory.attach(oracleImplementationAddress);
    await OracleImplementation.initialize(
        '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf', // CHAINLINK_FEED_REGISTRY
        '0x1F98431c8aD98523631AE4a59f267346ea31F984', // UNISWAP_FACTORY
        helper.address // UNISWAP_ORACLE_HELPER
    );

    await OracleContract.setUniswapPools(
        [XSGD, XSGD, XSGD, WBTC],
        [WETH, USDC, WBTC, USDC],
        [
            '0xfcA9090D2C91e11cC546b0D7E4918c79e0088194',
            '0x6279653c28f138C8B31b8A0F6F8cD2C58E8c1705',
            '0xbc32d18c5c1138094dabeb3b4d5b720db75c823c',
            '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35'
        ]
    );

    await OracleContract.setChainlinkTokens(
        [WETH, WBTC, DAI, USDC, USDT],
        [
            '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', 
            '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
            '0x0000000000000000000000000000000000000348',
            '0x0000000000000000000000000000000000000348',
            '0x0000000000000000000000000000000000000348'
        ]
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
