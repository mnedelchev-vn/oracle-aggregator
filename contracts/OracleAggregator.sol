// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IChainLinkRegistry.sol";
import "./interfaces/IUniswapOracleHelper.sol";

contract OracleAggregator is OwnableUpgradeable, UUPSUpgradeable {
    address public chainlinkFeedRegistry;
    address public uniswapFactory;
    address public uniswapOracleHelper;

    mapping(address => address) chainlinkTokens;
    mapping(address => mapping(address => address)) uniswapPools;

    error InvalidPair();
    error InvalidPool();

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

    function setChainlinkTokens(address[] calldata _tokens, address[] calldata _chainlinkTokens) external onlyOwner {
        for (uint256 i; i < _tokens.length;) {
            chainlinkTokens[_tokens[i]] = _chainlinkTokens[i];
            unchecked {
                i+=1;
            }
        }
    }

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

    function checkForPrice(address _tokenIn, address _tokenOut) external view returns(uint256) {
        if (_tokenIn == _tokenOut) {
            revert InvalidPair();
        }

        uint256 tokenInDecimals = IERC20(_tokenIn).decimals();
        uint256 tokenOutDecimals = IERC20(_tokenOut).decimals();

        address tokenInOnCall;
        address tokenOutOnCall;

        if (chainlinkTokens[_tokenIn] != address(0)) {
            tokenInOnCall = _tokenIn;
            _tokenIn = chainlinkTokens[_tokenIn];
        }

        if (chainlinkTokens[_tokenOut] != address(0)) {
            tokenOutOnCall = _tokenOut;
            _tokenOut = chainlinkTokens[_tokenOut];
        }

        try IChainLinkRegistry(chainlinkFeedRegistry).latestAnswer(_tokenIn, _tokenOut) returns (int256 answer) {
            // TRY CHAINLINK _tokenIn => _tokenOut
            if (IChainLinkRegistry(chainlinkFeedRegistry).decimals(_tokenIn, _tokenOut) > tokenOutDecimals) {
                return uint256(answer) / (10 ** (IChainLinkRegistry(chainlinkFeedRegistry).decimals(_tokenIn, _tokenOut) - tokenOutDecimals));
            } else if (IChainLinkRegistry(chainlinkFeedRegistry).decimals(_tokenIn, _tokenOut) < tokenOutDecimals) {
                return uint256(answer) * (10 ** (tokenOutDecimals - IChainLinkRegistry(chainlinkFeedRegistry).decimals(_tokenIn, _tokenOut)));
            } else {
                return uint256(answer);
            }
        } catch {
            // TRY CHAINLINK _tokenOut => _tokenIn
            try IChainLinkRegistry(chainlinkFeedRegistry).latestAnswer(_tokenOut, _tokenIn) returns (int256 answer) {
                if (IChainLinkRegistry(chainlinkFeedRegistry).decimals(_tokenOut, _tokenIn) > tokenInDecimals) {
                    return ((10 ** tokenInDecimals) * (10 ** tokenOutDecimals)) / (uint256(answer) / (10 ** (IChainLinkRegistry(chainlinkFeedRegistry).decimals(_tokenOut, _tokenIn) - tokenInDecimals)));
                } else if (IChainLinkRegistry(chainlinkFeedRegistry).decimals(_tokenOut, _tokenIn) < tokenInDecimals) {
                    return ((10 ** tokenInDecimals) * (10 ** tokenOutDecimals)) / (uint256(answer) * (10 ** (tokenInDecimals - IChainLinkRegistry(chainlinkFeedRegistry).decimals(_tokenOut, _tokenIn))));
                } else {
                    return ((10 ** tokenInDecimals) * (10 ** tokenOutDecimals)) / uint256(answer);
                }
            } catch {
                // UNISWAP FALLBACK
                if (tokenInOnCall != address(0)) {
                    _tokenIn = tokenInOnCall;
                }

                if (tokenOutOnCall != address(0)) {
                    _tokenOut = tokenOutOnCall;
                }

                return uint256(estimateUniswapV3AmountOut(_tokenIn, _tokenOut));
            }
        }
    }

    function estimateUniswapV3AmountOut(address _tokenIn, address _tokenOut) public view returns(uint) {
        address pool = uniswapPools[_tokenIn][_tokenOut];
        if (pool == address(0)) {
            pool = uniswapPools[_tokenOut][_tokenIn];
        }
        if (pool == address(0)) {
            revert InvalidPool();
        }

        return IUniswapOracleHelper(uniswapOracleHelper).getQuoteAtTick(pool, uint128(10 ** IERC20(_tokenIn).decimals()), _tokenIn, _tokenOut);
    }
}