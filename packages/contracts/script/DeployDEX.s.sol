// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {XfernoFactory} from "../src/dex/XfernoFactory.sol";
import {XfernoRouter} from "../src/dex/XfernoRouter.sol";
import {WETH} from "../src/dex/WETH.sol";

/**
 * @title DeployDEX
 * @notice Deployment script for XFERNO DEX contracts
 * 
 * Usage:
 *   forge script script/DeployDEX.s.sol:DeployDEXSepolia --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
 */
contract DeployDEX is Script {
    // Deployed addresses
    address public wethAddress;
    address public factoryAddress;
    address public routerAddress;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);

        console.log("");
        console.log("===========================================");
        console.log("     XFERNO DEX Deployment");
        console.log("===========================================");
        console.log("");
        console.log("Network:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Fee Recipient:", feeRecipient);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy WETH
        WETH weth = new WETH();
        wethAddress = address(weth);
        console.log("WETH deployed:", wethAddress);

        // 2. Deploy Factory
        XfernoFactory factory = new XfernoFactory(deployer);
        factoryAddress = address(factory);
        console.log("XfernoFactory deployed:", factoryAddress);

        // 3. Set fee recipient
        factory.setFeeTo(feeRecipient);
        console.log("Fee recipient set:", feeRecipient);

        // 4. Deploy Router
        XfernoRouter router = new XfernoRouter(factoryAddress, wethAddress);
        routerAddress = address(router);
        console.log("XfernoRouter deployed:", routerAddress);

        // 5. Log pair code hash for XfernoLibrary
        bytes32 pairCodeHash = factory.pairCodeHash();
        console.log("Pair code hash:", vm.toString(pairCodeHash));
        console.log("(Update XfernoLibrary.pairFor() with this hash)");

        vm.stopBroadcast();

        // Output summary
        _printDeploymentSummary();
        _writeDeploymentFile();
    }

    function _printDeploymentSummary() internal view {
        console.log("");
        console.log("===========================================");
        console.log("     XFERNO DEX Deployment Complete!");
        console.log("===========================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  WETH:", wethAddress);
        console.log("  XfernoFactory:", factoryAddress);
        console.log("  XfernoRouter:", routerAddress);
        console.log("");
        console.log("Next Steps:");
        console.log("  1. Verify contracts on block explorer");
        console.log("  2. Update GraduationEngine with router address");
        console.log("  3. Update frontend with DEX addresses");
        console.log("  4. Create first liquidity pair");
        console.log("");
    }

    function _writeDeploymentFile() internal {
        string memory json = string.concat(
            '{\n',
            '  "chainId": ', vm.toString(block.chainid), ',\n',
            '  "weth": "', vm.toString(wethAddress), '",\n',
            '  "factory": "', vm.toString(factoryAddress), '",\n',
            '  "router": "', vm.toString(routerAddress), '"\n',
            '}'
        );

        string memory filename = string.concat(
            "deployments/dex-",
            vm.toString(block.chainid),
            ".json"
        );

        vm.writeFile(filename, json);
        console.log("Deployment file written:", filename);
    }
}

/**
 * @title DeployDEXSepolia
 * @notice Convenience script for Sepolia testnet
 */
contract DeployDEXSepolia is DeployDEX {
    // Uses parent run() function
}
