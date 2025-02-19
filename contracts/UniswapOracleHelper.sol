// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;

import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";

contract UniswapOracleHelper {
    uint32 public constant UNISWAP_TWAP_RANGE = 300; // 5 minutes TWAP

    function getQuoteAtTick(
        address pool,
        uint128 baseAmount,
        address baseToken,
        address quoteToken
    ) public view returns(uint) {
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = UNISWAP_TWAP_RANGE;
        secondsAgos[1] = 0;

        (int56[] memory tickCumulatives, ) = IUniswapV3Pool(pool).observe(secondsAgos);

        int56 tickCumulativesDelta = tickCumulatives[1] - tickCumulatives[0];

        int24 tick = int24(tickCumulativesDelta / UNISWAP_TWAP_RANGE);
        if (tickCumulativesDelta < 0 && (tickCumulativesDelta % UNISWAP_TWAP_RANGE != 0)) {
            tick-=1;
        }

        return OracleLibrary.getQuoteAtTick(
            tick,
            baseAmount,
            baseToken,
            quoteToken
        );
    }
}