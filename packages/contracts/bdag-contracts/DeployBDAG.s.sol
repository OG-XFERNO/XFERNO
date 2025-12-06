// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "./TokenFactory.sol";
import "./BondingCurve.sol";

/**
 * @title DeployBDAG
 * @notice Deployment script for XFERNO contracts on BlockDAG
 * @dev Uses Paris EVM version for BDAG compatibility
 */
contract DeployBDAG is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);
        
        // Configuration
        uint256 creationFee = vm.envOr("CREATION_FEE", uint256(0.001 ether));
        uint256 virtualEthReserve = vm.envOr("VIRTUAL_ETH", uint256(30 ether));
        uint256 virtualTokenReserve = vm.envOr("VIRTUAL_TOKEN", uint256(1_000_000_000 ether));
        uint256 graduationThreshold = vm.envOr("GRADUATION_THRESHOLD", uint256(6.9 ether));
        uint256 feeBps = vm.envOr("FEE_BPS", uint256(100));
        
        console.log("");
        console.log("===========================================");
        console.log("  XFERNO BDAG Deployment (Paris EVM)");
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
        BondingCurve bondingCurve = new BondingCurve(
            deployer,
            address(0), // dexFactory - will be set later
            feeRecipient,
            virtualEthReserve,
            virtualTokenReserve,
            graduationThreshold,
            feeBps
        );
        console.log("BondingCurve deployed:", address(bondingCurve));
        
        // Deploy TokenFactory
        TokenFactory tokenFactory = new TokenFactory(
            deployer,
            address(bondingCurve),
            creationFee
        );
        console.log("TokenFactory deployed:", address(tokenFactory));
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("===========================================");
        console.log("  BDAG Deployment Complete!");
        console.log("===========================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  BondingCurve:", address(bondingCurve));
        console.log("  TokenFactory:", address(tokenFactory));
        
        // Write deployment file
        string memory json = string(abi.encodePacked(
            '{\n  "chainId": ', vm.toString(block.chainid),
            ',\n  "network": "BlockDAG Awakening",',
            '\n  "evmVersion": "paris",',
            '\n  "bondingCurve": "', vm.toString(address(bondingCurve)),
            '",\n  "tokenFactory": "', vm.toString(address(tokenFactory)),
            '",\n  "creationFee": "', vm.toString(creationFee),
            '",\n  "graduationThreshold": "', vm.toString(graduationThreshold),
            '",\n  "feeBps": ', vm.toString(feeBps),
            '\n}'
        ));
        
        vm.writeFile(
            string(abi.encodePacked("deployments/bdag-", vm.toString(block.chainid), ".json")),
            json
        );
        console.log("");
        console.log("Deployment saved to deployments/bdag-", vm.toString(block.chainid), ".json");
    }
}
