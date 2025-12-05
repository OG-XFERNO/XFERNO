// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {GraduationEngine} from "../src/graduation/GraduationEngine.sol";

/**
 * @title DeployGraduationEngine
 * @notice Deployment script for GraduationEngine with XFERNO DEX
 */
contract DeployGraduationEngine is Script {
    address public graduationEngineAddress;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);
        
        // XFERNO DEX Router on Sepolia
        address xfernoRouter = 0xEDa7b0a02c994615909A62c318227673d3C9BC3a;
        // BondingCurve on Sepolia
        address bondingCurve = 0x5e32fb2100EED4FdAe0f65ecB7dC30291d9Fc751;

        console.log("");
        console.log("===========================================");
        console.log("     GraduationEngine Deployment");
        console.log("===========================================");
        console.log("");
        console.log("Network:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("XFERNO Router:", xfernoRouter);
        console.log("BondingCurve:", bondingCurve);
        console.log("Fee Recipient:", feeRecipient);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        GraduationEngine graduationEngine = new GraduationEngine(
            xfernoRouter,
            bondingCurve,
            feeRecipient
        );
        graduationEngineAddress = address(graduationEngine);
        console.log("GraduationEngine deployed:", graduationEngineAddress);

        vm.stopBroadcast();

        _printSummary();
        _writeDeploymentFile();
    }

    function _printSummary() internal view {
        console.log("");
        console.log("===========================================");
        console.log("     GraduationEngine Deployed!");
        console.log("===========================================");
        console.log("");
        console.log("  GraduationEngine:", graduationEngineAddress);
        console.log("");
    }

    function _writeDeploymentFile() internal {
        string memory json = string.concat(
            '{\n',
            '  "chainId": ', vm.toString(block.chainid), ',\n',
            '  "graduationEngine": "', vm.toString(graduationEngineAddress), '"\n',
            '}'
        );

        string memory filename = string.concat(
            "deployments/graduation-",
            vm.toString(block.chainid),
            ".json"
        );

        vm.writeFile(filename, json);
        console.log("Deployment file written:", filename);
    }
}
