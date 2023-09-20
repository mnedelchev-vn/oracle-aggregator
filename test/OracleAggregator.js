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
    let SHIB = '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce';

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
        ], {kind: 'uups'});
        await OracleContract.deployed();

        await OracleContract.setUniswapPools(
            [XSGD, XSGD, XSGD, WETH, WETH, WETH, WETH, WBTC, WBTC, WBTC],
            [WETH, USDC, WBTC, USDC, WBTC, USDT, DAI, USDC, USDT, DAI],
            [
                '0xfcA9090D2C91e11cC546b0D7E4918c79e0088194',
                '0x6279653c28f138C8B31b8A0F6F8cD2C58E8c1705',
                '0xbc32d18c5c1138094dabeb3b4d5b720db75c823c',
                '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
                '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed',
                '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36',
                '0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8',
                '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35',
                '0x9db9e0e53058c89e5b94e29621a205198648425b',
                '0x391e8501b626c623d39474afca6f9e46c2686649',
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

    it('Test Chainlink over Uniswap', async function () {
        let chainlinkVariations = {
            usdcToWeth: await OracleContract.priceChainlinkOverUniswap(USDC, WETH),
            wethToUsdc: await OracleContract.priceChainlinkOverUniswap(WETH, USDC),
            usdtToWeth: await OracleContract.priceChainlinkOverUniswap(USDT, WETH),
            wethToUsdt: await OracleContract.priceChainlinkOverUniswap(WETH, USDT),
            daiToWeth: await OracleContract.priceChainlinkOverUniswap(DAI, WETH),
            wethToDai: await OracleContract.priceChainlinkOverUniswap(WETH, DAI),
            wbtcToWeth: await OracleContract.priceChainlinkOverUniswap(WBTC, WETH),
            wethToWbtc: await OracleContract.priceChainlinkOverUniswap(WETH, WBTC),
            usdcToWbtc: await OracleContract.priceChainlinkOverUniswap(USDC, WBTC),
            wbtcToUsdc: await OracleContract.priceChainlinkOverUniswap(WBTC, USDC),
            usdtToWbtc: await OracleContract.priceChainlinkOverUniswap(USDT, WBTC),
            wbtcToUsdt: await OracleContract.priceChainlinkOverUniswap(WBTC, USDT),
            daiToWbtc: await OracleContract.priceChainlinkOverUniswap(DAI, WBTC),
            wbtcToDai: await OracleContract.priceChainlinkOverUniswap(WBTC, DAI)
        }
        
        for (let key in chainlinkVariations) {
            console.log(key, chainlinkVariations[key]);
            await expect(chainlinkVariations[key]).to.be.greaterThan(0);
        }
    });

    it('Test Uniswap over Chainlink', async function () {
        let chainlinkVariations = {
            usdcToWeth: await OracleContract.priceUniswapOverChainlink(USDC, WETH),
            wethToUsdc: await OracleContract.priceUniswapOverChainlink(WETH, USDC),
            usdtToWeth: await OracleContract.priceUniswapOverChainlink(USDT, WETH),
            wethToUsdt: await OracleContract.priceUniswapOverChainlink(WETH, USDT),
            daiToWeth: await OracleContract.priceUniswapOverChainlink(DAI, WETH),
            wethToDai: await OracleContract.priceUniswapOverChainlink(WETH, DAI),
            wbtcToWeth: await OracleContract.priceUniswapOverChainlink(WBTC, WETH),
            wethToWbtc: await OracleContract.priceUniswapOverChainlink(WETH, WBTC),
            usdcToWbtc: await OracleContract.priceUniswapOverChainlink(USDC, WBTC),
            wbtcToUsdc: await OracleContract.priceUniswapOverChainlink(WBTC, USDC),
            usdtToWbtc: await OracleContract.priceUniswapOverChainlink(USDT, WBTC),
            wbtcToUsdt: await OracleContract.priceUniswapOverChainlink(WBTC, USDT),
            daiToWbtc: await OracleContract.priceUniswapOverChainlink(DAI, WBTC),
            wbtcToDai: await OracleContract.priceUniswapOverChainlink(WBTC, DAI)
        }
        
        for (let key in chainlinkVariations) {
            console.log(key, chainlinkVariations[key]);
            await expect(chainlinkVariations[key]).to.be.greaterThan(0);
        }
    });

    it('Test non-existing pairs', async function () {
        // InvalidPair
        await expect(
            OracleContract.priceChainlinkOverUniswap(WBTC, WBTC)
        ).to.be.revertedWithCustomError(
            OracleContract,
            "InvalidPair"
        );

        // InvalidChainlinkPool
        await expect(
            OracleContract.priceUniswapOverChainlink(XSGD, SHIB)
        ).to.be.revertedWithCustomError(
            OracleContract,
            "InvalidChainlinkPool"
        );

        // InvalidUniswapPool
        await expect(
            OracleContract.priceChainlinkOverUniswap(XSGD, DAI)
        ).to.be.revertedWithCustomError(
            OracleContract,
            "InvalidUniswapPool"
        );
    });
});