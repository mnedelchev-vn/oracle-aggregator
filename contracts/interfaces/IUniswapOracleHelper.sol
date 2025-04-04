// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

interface IUniswapOracleHelper {
    function getQuoteAtTick(
        address pool,
        uint128 baseAmount,
        address baseToken,
        address quoteToken
    ) external view returns(uint);
}