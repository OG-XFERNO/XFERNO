// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TokenFactory} from "../src/factory/TokenFactory.sol";
import {BondingCurve, IBondingCurve} from "../src/curve/BondingCurve.sol";

/**
 * @title Deploy
 * @notice Deployment script for XFERNO contracts
 * @dev Supports multiple networks with configurable parameters
 *
 * Usage:
 *   forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
 *
 * Environment Variables:
 *   PRIVATE_KEY          - Deployer private key (required)
 *   FEE_RECIPIENT        - Address to receive fees (optional, defaults to deployer)
 *   DEX_FACTORY          - DEX factory for graduation (optional)
 *   CREATION_FEE         - Token creation fee in wei (optional)
 *   VIRTUAL_ETH          - Virtual ETH reserve (optional)
 *   VIRTUAL_TOKEN        - Virtual token reserve (optional)
 *   GRADUATION_THRESHOLD - ETH threshold for graduation (optional)
 *   FEE_BPS              - Platform fee in basis points (optional)
 */
contract Deploy is Script {
    // Default configuration - can be overridden via environment
    uint256 public creationFee;
    uint256 public virtualEthReserve;
    uint256 public virtualTokenReserve;
    uint256 public graduationThreshold;
    uint256 public feeBps;

    // Deployed contract addresses
    address public bondingCurveAddress;
    address public tokenFactoryAddress;

    function setUp() public {
        // Load configuration from environment with defaults
        creationFee = vm.envOr("CREATION_FEE", uint256(0.001 ether)); // Lower for testnet
        virtualEthReserve = vm.envOr("VIRTUAL_ETH", uint256(30 ether));
        virtualTokenReserve = vm.envOr("VIRTUAL_TOKEN", uint256(1_000_000_000 ether));
        graduationThreshold = vm.envOr("GRADUATION_THRESHOLD", uint256(69 ether));
        feeBps = vm.envOr("FEE_BPS", uint256(100)); // 1%
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);
        address dexFactory = vm.envOr("DEX_FACTORY", address(0));

        console.log("");
        console.log("===========================================");
        console.log("     XFERNO Contract Deployment");
        console.log("===========================================");
        console.log("");
        console.log("Network:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Fee Recipient:", feeRecipient);
        console.log("");
        console.log("Configuration:");
        console.log("  Creation Fee:", creationFee);
        console.log("  Virtual ETH Reserve:", virtualEthReserve);
        console.log("  Virtual Token Reserve:", virtualTokenReserve);
        console.log("  Graduation Threshold:", graduationThreshold);
        console.log("  Fee BPS:", feeBps);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy BondingCurve
        IBondingCurve.CurveParams memory curveParams = IBondingCurve.CurveParams({
            virtualEthReserve: virtualEthReserve,
            virtualTokenReserve: virtualTokenReserve,
            graduationThreshold: graduationThreshold,
            feeBps: feeBps
        });

        BondingCurve bondingCurve = new BondingCurve(
            deployer,
            dexFactory,
            feeRecipient,
            curveParams
        );
        bondingCurveAddress = address(bondingCurve);
        console.log("BondingCurve deployed:", bondingCurveAddress);

        // Deploy TokenFactory
        TokenFactory tokenFactory = new TokenFactory(
            deployer,
            bondingCurveAddress,
            creationFee
        );
        tokenFactoryAddress = address(tokenFactory);
        console.log("TokenFactory deployed:", tokenFactoryAddress);

        vm.stopBroadcast();

        // Output deployment summary
        _printDeploymentSummary();

        // Write deployment addresses to file
        _writeDeploymentFile();
    }

    function _printDeploymentSummary() internal view {
        console.log("");
        console.log("===========================================");
        console.log("     Deployment Complete!");
        console.log("===========================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  BondingCurve:", bondingCurveAddress);
        console.log("  TokenFactory:", tokenFactoryAddress);
        console.log("");
        console.log("Next Steps:");
        console.log("  1. Verify contracts on block explorer");
        console.log("  2. Update frontend contract addresses");
        console.log("  3. Test token creation on testnet");
        console.log("");
    }

    function _writeDeploymentFile() internal {
        // Create JSON output for deployment addresses
        string memory json = string.concat(
            '{\n',
            '  "chainId": ', vm.toString(block.chainid), ',\n',
            '  "bondingCurve": "', vm.toString(bondingCurveAddress), '",\n',
            '  "tokenFactory": "', vm.toString(tokenFactoryAddress), '",\n',
            '  "creationFee": "', vm.toString(creationFee), '",\n',
            '  "graduationThreshold": "', vm.toString(graduationThreshold), '",\n',
            '  "feeBps": ', vm.toString(feeBps), '\n',
            '}'
        );

        string memory filename = string.concat(
            "deployments/",
            vm.toString(block.chainid),
            ".json"
        );

        vm.writeFile(filename, json);
        console.log("Deployment file written:", filename);
    }
}

/**
 * @title DeploySepolia
 * @notice Convenience script for Sepolia testnet deployment
 */
contract DeploySepolia is Deploy {
    function setUp() public override {
        // Testnet-friendly configuration
        creationFee = 0.001 ether; // Lower fee for testing
        virtualEthReserve = 3 ether; // Lower reserves for testing
        virtualTokenReserve = 1_000_000_000 ether;
        graduationThreshold = 6.9 ether; // Lower threshold for testing
        feeBps = 100;
    }
}

/**
 * @title DeployBaseSepolia
 * @notice Convenience script for Base Sepolia testnet deployment
 */
contract DeployBaseSepolia is Deploy {
    function setUp() public override {
        // Testnet-friendly configuration
        creationFee = 0.0001 ether; // Very low for Base Sepolia
        virtualEthReserve = 1 ether;
        virtualTokenReserve = 1_000_000_000 ether;
        graduationThreshold = 2 ether;
        feeBps = 100;
    }
}
