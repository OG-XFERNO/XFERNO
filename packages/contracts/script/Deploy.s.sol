// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TokenFactory} from "../src/factory/TokenFactory.sol";
import {BondingCurve, IBondingCurve} from "../src/curve/BondingCurve.sol";

/**
 * @title Deploy
 * @notice Deployment script for XFERNO contracts
 */
contract Deploy is Script {
    // Default configuration
    uint256 constant CREATION_FEE = 0.01 ether;
    uint256 constant VIRTUAL_ETH_RESERVE = 30 ether;
    uint256 constant VIRTUAL_TOKEN_RESERVE = 1_000_000_000 ether; // 1B tokens
    uint256 constant GRADUATION_THRESHOLD = 69 ether;
    uint256 constant FEE_BPS = 100; // 1%

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);
        address dexFactory = vm.envOr("DEX_FACTORY", address(0));

        console.log("Deploying XFERNO contracts...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy BondingCurve
        IBondingCurve.CurveParams memory curveParams = IBondingCurve.CurveParams({
            virtualEthReserve: VIRTUAL_ETH_RESERVE,
            virtualTokenReserve: VIRTUAL_TOKEN_RESERVE,
            graduationThreshold: GRADUATION_THRESHOLD,
            feeBps: FEE_BPS
        });

        BondingCurve bondingCurve = new BondingCurve(
            deployer,
            dexFactory,
            feeRecipient,
            curveParams
        );
        console.log("BondingCurve deployed:", address(bondingCurve));

        // Deploy TokenFactory
        TokenFactory tokenFactory = new TokenFactory(
            deployer,
            address(bondingCurve),
            CREATION_FEE
        );
        console.log("TokenFactory deployed:", address(tokenFactory));

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("BondingCurve:", address(bondingCurve));
        console.log("TokenFactory:", address(tokenFactory));
    }
}
