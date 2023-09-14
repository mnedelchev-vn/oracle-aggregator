// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

interface IChainLinkRegistry {
    function latestAnswer(address base, address quote) external view returns(int256 answer);

    function decimals(address base, address quote) external view returns (uint8);
}