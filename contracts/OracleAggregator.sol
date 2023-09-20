// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IChainLinkRegistry.sol";
import "./interfaces/IUniswapOracleHelper.sol";

/// @title An aggregator for oracles
/// @author Miroslav Nedelchev
contract OracleAggregator is OwnableUpgradeable, UUPSUpgradeable {
    address public chainlinkFeedRegistry;
    address public uniswapFactory;
    address public uniswapOracleHelper;

    mapping(address => address) chainlinkTokens;
    mapping(address => mapping(address => address)) uniswapPools;

    error InvalidPair();
    error InvalidChainlinkPool();
    error InvalidUniswapPool();

    function initialize(
        address _chainlinkFeedRegistry,
        address _uniswapFactory,
        address _uniswapOracleHelper
    ) public initializer {       
        __Ownable_init();

        chainlinkFeedRegistry = _chainlinkFeedRegistry;
        uniswapFactory = _uniswapFactory;
        uniswapOracleHelper = _uniswapOracleHelper;
    }

    /*
     * CONTRACT OWNER
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /// @notice Saving the internal Chainlink tokens
    /// @param _tokens The usual tokens addresses
    /// @param _chainlinkTokens The internal Chainlink tokens addresses
    function setChainlinkTokens(address[] calldata _tokens, address[] calldata _chainlinkTokens) external onlyOwner {
        for (uint256 i; i < _tokens.length;) {
            chainlinkTokens[_tokens[i]] = _chainlinkTokens[i];
            unchecked {
                i+=1;
            }
        }
    }

    /// @notice Saving the supported Uniswap pools
    /// @param _tokensIn The tokens in of a specific trading pair
    /// @param _tokensOut The tokens out of a specific trading pair
    /// @param _uniswapPools The Uniswap pools of the tokens in & tokens out
    function setUniswapPools(address[] calldata _tokensIn, address[] calldata _tokensOut, address[] calldata _uniswapPools) external onlyOwner {
        for (uint256 i; i < _tokensIn.length;) {
            uniswapPools[_tokensIn[i]][_tokensOut[i]] = _uniswapPools[i];
            unchecked {
                i+=1;
            }
        }
    }
    /*
     * /CONTRACT OWNER
     */

    /// @notice Get pair price with Chainlink priority over Uniswap
    /// @param _tokenIn The token in of a specific trading pair
    /// @param _tokenOut The token out of a specific trading pair
    /// @return Price of how much _tokenIn equals in _tokenOut
    function priceChainlinkOverUniswap(address _tokenIn, address _tokenOut) external view returns(uint256) {
        if (_tokenIn == _tokenOut) {
            revert InvalidPair();
        }

        try this.chainlinkOracle(_tokenIn, _tokenOut) returns (uint price) {
            return price;
        } catch {
            try this.uniswapOracle(_tokenIn, _tokenOut) returns (uint price) {
                return price;
            } catch {
                revert InvalidUniswapPool();
            }
        }
    }

    /// @notice Get pair price with Uniswap priority over Chainlink
    /// @param _tokenIn The token in of a specific trading pair
    /// @param _tokenOut The token out of a specific trading pair
    /// @return Price of how much _tokenIn equals in _tokenOut
    function priceUniswapOverChainlink(address _tokenIn, address _tokenOut) external view returns(uint256) {
        if (_tokenIn == _tokenOut) {
            revert InvalidPair();
        }

        try this.uniswapOracle(_tokenIn, _tokenOut) returns (uint price) {
            return price;
        } catch {
            try this.chainlinkOracle(_tokenIn, _tokenOut) returns (uint price) {
                return price;
            } catch {
                revert InvalidChainlinkPool();
            }
        }
    }

    /// @notice Get pair price by Chainlink
    /// @param _tokenIn The token in of a specific trading pair
    /// @param _tokenOut The token out of a specific trading pair
    /// @return Price of how much _tokenIn equals in _tokenOut
    function chainlinkOracle(address _tokenIn, address _tokenOut) public view returns(uint) {
        uint256 tokenInDecimals = IERC20(_tokenIn).decimals();
        uint256 tokenOutDecimals = IERC20(_tokenOut).decimals();

        if (chainlinkTokens[_tokenIn] != address(0)) {
            _tokenIn = chainlinkTokens[_tokenIn];
        }

        if (chainlinkTokens[_tokenOut] != address(0)) {
            _tokenOut = chainlinkTokens[_tokenOut];
        }

        try IChainLinkRegistry(chainlinkFeedRegistry).latestAnswer(_tokenIn, _tokenOut) returns (int256 answer) {
            // TRY CHAINLINK _tokenIn => _tokenOut
            uint inOutDecimals = IChainLinkRegistry(chainlinkFeedRegistry).decimals(_tokenIn, _tokenOut);
            if (inOutDecimals > tokenOutDecimals) {
                return uint256(answer) / (10 ** (inOutDecimals - tokenOutDecimals));
            } else if (inOutDecimals < tokenOutDecimals) {
                return uint256(answer) * (10 ** (tokenOutDecimals - inOutDecimals));
            } else {
                return uint256(answer);
            }
        } catch {
            // TRY CHAINLINK _tokenOut => _tokenIn
            try IChainLinkRegistry(chainlinkFeedRegistry).latestAnswer(_tokenOut, _tokenIn) returns (int256 answer) {
                uint outInDecimals = IChainLinkRegistry(chainlinkFeedRegistry).decimals(_tokenOut, _tokenIn);
                if (outInDecimals > tokenInDecimals) {
                    return ((10 ** tokenInDecimals) * (10 ** tokenOutDecimals)) / (uint256(answer) / (10 ** (outInDecimals - tokenInDecimals)));
                } else if (outInDecimals < tokenInDecimals) {
                    return ((10 ** tokenInDecimals) * (10 ** tokenOutDecimals)) / (uint256(answer) * (10 ** (tokenInDecimals - outInDecimals)));
                } else {
                    return ((10 ** tokenInDecimals) * (10 ** tokenOutDecimals)) / uint256(answer);
                }
            } catch {
                revert InvalidChainlinkPool();
            }
        }
    }

    /// @notice Get pair price by Uniswap
    /// @param _tokenIn The token in of a specific trading pair
    /// @param _tokenOut The token out of a specific trading pair
    /// @return Price of how much _tokenIn equals in _tokenOut
    function uniswapOracle(address _tokenIn, address _tokenOut) public view returns(uint) {
        address pool = uniswapPools[_tokenIn][_tokenOut];
        if (pool == address(0)) {
            pool = uniswapPools[_tokenOut][_tokenIn];
            if (pool == address(0)) {
                revert InvalidUniswapPool();
            }
        }

        return IUniswapOracleHelper(uniswapOracleHelper).getQuoteAtTick(pool, uint128(10 ** IERC20(_tokenIn).decimals()), _tokenIn, _tokenOut);
    }
}