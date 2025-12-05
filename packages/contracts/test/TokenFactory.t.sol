// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {TokenFactory, ITokenFactory} from "../src/factory/TokenFactory.sol";
import {BondingCurve, IBondingCurve} from "../src/curve/BondingCurve.sol";
import {XfernoToken} from "../src/token/XfernoToken.sol";

contract TokenFactoryTest is Test {
    TokenFactory public factory;
    BondingCurve public bondingCurve;

    address public owner = makeAddr("owner");
    address public creator = makeAddr("creator");
    address public buyer = makeAddr("buyer");

    uint256 constant CREATION_FEE = 0.01 ether;
    uint256 constant VIRTUAL_ETH = 30 ether;
    uint256 constant VIRTUAL_TOKEN = 1_000_000_000 ether;
    uint256 constant GRADUATION_THRESHOLD = 69 ether;

    function setUp() public {
        vm.startPrank(owner);

        // Deploy bonding curve
        IBondingCurve.CurveParams memory params = IBondingCurve.CurveParams({
            virtualEthReserve: VIRTUAL_ETH,
            virtualTokenReserve: VIRTUAL_TOKEN,
            graduationThreshold: GRADUATION_THRESHOLD,
            feeBps: 100
        });

        bondingCurve = new BondingCurve(owner, address(0), owner, params);

        // Deploy factory
        factory = new TokenFactory(owner, address(bondingCurve), CREATION_FEE);

        vm.stopPrank();

        // Fund accounts
        vm.deal(creator, 100 ether);
        vm.deal(buyer, 100 ether);
    }

    function test_CreateToken() public {
        vm.startPrank(creator);

        string[] memory links = new string[](2);
        links[0] = "https://twitter.com/test";
        links[1] = "https://t.me/test";

        ITokenFactory.TokenParams memory params = ITokenFactory.TokenParams({
            name: "Test Token",
            symbol: "TEST",
            description: "A test token",
            imageUri: "https://example.com/image.png",
            socialLinks: links
        });

        address token = factory.createToken{value: CREATION_FEE}(params);

        // Verify token
        assertTrue(factory.isXfernoToken(token));
        assertEq(factory.totalTokens(), 1);
        assertEq(factory.getTokensByCreator(creator).length, 1);
        assertEq(factory.getTokensByCreator(creator)[0], token);

        // Verify token properties
        XfernoToken xfernoToken = XfernoToken(token);
        assertEq(xfernoToken.name(), "Test Token");
        assertEq(xfernoToken.symbol(), "TEST");
        assertEq(xfernoToken.creator(), creator);
        assertEq(xfernoToken.bondingCurve(), address(bondingCurve));

        vm.stopPrank();
    }

    function test_CreateTokenInsufficientFee() public {
        vm.startPrank(creator);

        string[] memory links = new string[](0);
        ITokenFactory.TokenParams memory params = ITokenFactory.TokenParams({
            name: "Test Token",
            symbol: "TEST",
            description: "",
            imageUri: "",
            socialLinks: links
        });

        vm.expectRevert(TokenFactory.InsufficientFee.selector);
        factory.createToken{value: 0.001 ether}(params);

        vm.stopPrank();
    }

    function test_CreateTokenEmptyName() public {
        vm.startPrank(creator);

        string[] memory links = new string[](0);
        ITokenFactory.TokenParams memory params = ITokenFactory.TokenParams({
            name: "",
            symbol: "TEST",
            description: "",
            imageUri: "",
            socialLinks: links
        });

        vm.expectRevert(TokenFactory.EmptyName.selector);
        factory.createToken{value: CREATION_FEE}(params);

        vm.stopPrank();
    }

    function test_SetCreationFee() public {
        vm.prank(owner);
        factory.setCreationFee(0.02 ether);

        assertEq(factory.creationFee(), 0.02 ether);
    }

    function test_SetCreationFeeNotOwner() public {
        vm.prank(creator);
        vm.expectRevert();
        factory.setCreationFee(0.02 ether);
    }

    function test_WithdrawFees() public {
        // Create a token to collect fee
        vm.prank(creator);
        string[] memory links = new string[](0);
        factory.createToken{value: CREATION_FEE}(
            ITokenFactory.TokenParams({
                name: "Test",
                symbol: "TEST",
                description: "",
                imageUri: "",
                socialLinks: links
            })
        );

        assertEq(address(factory).balance, CREATION_FEE);

        // Withdraw
        address recipient = makeAddr("recipient");
        vm.prank(owner);
        factory.withdrawFees(recipient);

        assertEq(address(factory).balance, 0);
        assertEq(recipient.balance, CREATION_FEE);
    }
}
