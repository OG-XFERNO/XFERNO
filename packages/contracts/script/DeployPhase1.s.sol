// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ZKRollup} from "../src/zk/ZKRollup.sol";
import {GraduationEngine} from "../src/graduation/GraduationEngine.sol";

/**
 * @title MockVerifier
 * @notice Placeholder verifier for testnet - always returns true
 * @dev Replace with actual Groth16 verifier in production
 */
contract MockVerifier {
    function verifyProof(
        uint256[8] calldata,
        uint256[] calldata
    ) external pure returns (bool) {
        return true; // Always valid for testing
    }
}

/**
 * @title DeployPhase1
 * @notice Deployment script for Phase 1 contracts (ZK Rollup & Graduation Engine)
 * 
 * Usage:
 *   forge script script/DeployPhase1.s.sol:DeployPhase1Sepolia --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
 *
 * Environment Variables:
 *   PRIVATE_KEY          - Deployer private key (required)
 *   FEE_RECIPIENT        - Address to receive fees (optional, defaults to deployer)
 *   BONDING_CURVE        - Existing BondingCurve address (required)
 *   UNISWAP_ROUTER       - Uniswap V2 Router address (required for graduation)
 */
contract DeployPhase1 is Script {
    // Deployed contract addresses
    address public verifierAddress;
    address public zkRollupAddress;
    address public graduationEngineAddress;

    // Configuration
    address public bondingCurve;
    address public uniswapRouter;
    bytes32 public initialStateRoot;

    function setUp() public virtual {
        // Load from environment or use defaults
        bondingCurve = vm.envOr("BONDING_CURVE", address(0));
        uniswapRouter = vm.envOr("UNISWAP_ROUTER", address(0));
        
        // Initial empty state root (Poseidon hash of empty tree)
        initialStateRoot = bytes32(0);
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);

        require(bondingCurve != address(0), "DeployPhase1: BONDING_CURVE required");

        console.log("");
        console.log("===========================================");
        console.log("     XFERNO Phase 1 Deployment");
        console.log("===========================================");
        console.log("");
        console.log("Network:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Fee Recipient:", feeRecipient);
        console.log("BondingCurve:", bondingCurve);
        console.log("Uniswap Router:", uniswapRouter);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock Verifier (for testnet)
        MockVerifier verifier = new MockVerifier();
        verifierAddress = address(verifier);
        console.log("MockVerifier deployed:", verifierAddress);

        // 2. Deploy ZK Rollup
        ZKRollup zkRollup = new ZKRollup(
            verifierAddress,
            deployer,           // operator
            initialStateRoot
        );
        zkRollupAddress = address(zkRollup);
        console.log("ZKRollup deployed:", zkRollupAddress);

        // 3. Enable ETH deposits on ZK Rollup
        zkRollup.addSupportedToken(address(0), 0.001 ether); // ETH with 0.001 min deposit
        console.log("ETH deposits enabled on ZKRollup");

        // 4. Deploy Graduation Engine (if router is configured)
        if (uniswapRouter != address(0)) {
            GraduationEngine graduationEngine = new GraduationEngine(
                uniswapRouter,
                bondingCurve,
                feeRecipient
            );
            graduationEngineAddress = address(graduationEngine);
            console.log("GraduationEngine deployed:", graduationEngineAddress);
        } else {
            console.log("GraduationEngine skipped (no UNISWAP_ROUTER)");
        }

        vm.stopBroadcast();

        // Output deployment summary
        _printDeploymentSummary();

        // Write deployment file
        _writeDeploymentFile();
    }

    function _printDeploymentSummary() internal view {
        console.log("");
        console.log("===========================================");
        console.log("     Phase 1 Deployment Complete!");
        console.log("===========================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  MockVerifier:", verifierAddress);
        console.log("  ZKRollup:", zkRollupAddress);
        if (graduationEngineAddress != address(0)) {
            console.log("  GraduationEngine:", graduationEngineAddress);
        }
        console.log("");
        console.log("Next Steps:");
        console.log("  1. Verify contracts on block explorer");
        console.log("  2. Update frontend contract addresses");
        console.log("  3. Test ZK deposits on testnet");
        console.log("  4. Replace MockVerifier with real verifier for production");
        console.log("");
    }

    function _writeDeploymentFile() internal {
        string memory json = string.concat(
            '{\n',
            '  "chainId": ', vm.toString(block.chainid), ',\n',
            '  "verifier": "', vm.toString(verifierAddress), '",\n',
            '  "zkRollup": "', vm.toString(zkRollupAddress), '",\n',
            '  "graduationEngine": "', vm.toString(graduationEngineAddress), '",\n',
            '  "bondingCurve": "', vm.toString(bondingCurve), '",\n',
            '  "uniswapRouter": "', vm.toString(uniswapRouter), '"\n',
            '}'
        );

        string memory filename = string.concat(
            "deployments/phase1-",
            vm.toString(block.chainid),
            ".json"
        );

        vm.writeFile(filename, json);
        console.log("Deployment file written:", filename);
    }
}

/**
 * @title DeployPhase1Sepolia
 * @notice Convenience script for Sepolia testnet
 */
contract DeployPhase1Sepolia is DeployPhase1 {
    function setUp() public override {
        // Existing Sepolia deployments
        bondingCurve = 0x5e32fb2100EED4FdAe0f65ecB7dC30291d9Fc751;
        
        // Uniswap V2 Router on Sepolia (if available)
        // Note: Uniswap V2 may not be on Sepolia, using placeholder
        uniswapRouter = vm.envOr("UNISWAP_ROUTER", address(0));
        
        initialStateRoot = bytes32(0);
    }
}
