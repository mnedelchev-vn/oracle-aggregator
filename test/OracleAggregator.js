const hre = require("hardhat");
const { ethers } = require("hardhat");
const { expect } = require("chai");

async function impersonateAddress(address) {
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address],
    });
    const signer = await ethers.provider.getSigner(address);
    signer.address = signer._address;
    return signer;
}

describe('Strategy test init.', async function () {
    let UniswapOracleHelper;
    let OracleFactory;
    let OracleContract;
    let WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    let USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    let USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
    let WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
    let DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    let XSGD = '0x70e8de73ce538da2beed35d14187f6959a8eca96';

    before(async function() {
        [owner] = await ethers.getSigners();
        user = await impersonateAddress("0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0");

        UniswapOracleHelper = await hre.ethers.getContractFactory('UniswapOracleHelper');
        UniswapOracleHelper = await UniswapOracleHelper.deploy();

        OracleFactory = await hre.ethers.getContractFactory('OracleAggregator');
        OracleContract = await upgrades.deployProxy(OracleFactory, [
            '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf', // CHAINLINK_FEED_REGISTRY
            '0x1F98431c8aD98523631AE4a59f267346ea31F984', // UNISWAP_FACTORY
            UniswapOracleHelper.address
        ]);
        await OracleContract.deployed();

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
    });

    it('Test ETH pairs', async function () {
        await expect(await OracleContract.connect(user).checkForPrice(USDC, WETH)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(WETH, USDC)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(USDT, WETH)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(WETH, USDT)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(DAI, WETH)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(WETH, DAI)).to.be.greaterThan(0);
    });

    it('Test WBTC pairs', async function () {
        await expect(await OracleContract.connect(user).checkForPrice(USDC, WBTC)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(WBTC, USDC)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(USDT, WBTC)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(WBTC, USDT)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(DAI, WBTC)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(WBTC, DAI)).to.be.greaterThan(0);
    });

    it('Test XSGD pairs ( Uniswap fallback )', async function () {
        await expect(await OracleContract.connect(user).checkForPrice(XSGD, WETH)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(WETH, XSGD)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(XSGD, USDC)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(USDC, XSGD)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(XSGD, WBTC)).to.be.greaterThan(0);
        await expect(await OracleContract.connect(user).checkForPrice(WBTC, XSGD)).to.be.greaterThan(0);
    });

    it('Test non-existing pairs', async function () {
        // InvalidPair
        await expect(
            OracleContract.connect(user).checkForPrice(WBTC, WBTC)
        ).to.be.revertedWithCustomError(
            OracleContract,
            "InvalidPair"
        );

        // InvalidPool
        await expect(
            OracleContract.connect(user).checkForPrice(XSGD, DAI)
        ).to.be.revertedWithCustomError(
            OracleContract,
            "InvalidPool"
        );
    });
});