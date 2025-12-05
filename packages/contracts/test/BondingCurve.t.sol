// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {TokenFactory, ITokenFactory} from "../src/factory/TokenFactory.sol";
import {BondingCurve, IBondingCurve} from "../src/curve/BondingCurve.sol";
import {XfernoToken} from "../src/token/XfernoToken.sol";

contract BondingCurveTest is Test {
    TokenFactory public factory;
    BondingCurve public bondingCurve;
    address public token;

    address public owner = makeAddr("owner");
    address public creator = makeAddr("creator");
    address public buyer1 = makeAddr("buyer1");
    address public buyer2 = makeAddr("buyer2");
    address public feeRecipient = makeAddr("feeRecipient");

    uint256 constant CREATION_FEE = 0.01 ether;
    uint256 constant VIRTUAL_ETH = 30 ether;
    uint256 constant VIRTUAL_TOKEN = 1_000_000_000 ether;
    uint256 constant GRADUATION_THRESHOLD = 69 ether;
    uint256 constant FEE_BPS = 100; // 1%

    function setUp() public {
        vm.startPrank(owner);

        // Deploy bonding curve
        IBondingCurve.CurveParams memory params = IBondingCurve.CurveParams({
            virtualEthReserve: VIRTUAL_ETH,
            virtualTokenReserve: VIRTUAL_TOKEN,
            graduationThreshold: GRADUATION_THRESHOLD,
            feeBps: FEE_BPS
        });

        bondingCurve = new BondingCurve(owner, address(0), feeRecipient, params);

        // Deploy factory
        factory = new TokenFactory(owner, address(bondingCurve), CREATION_FEE);

        vm.stopPrank();

        // Create a token for testing
        vm.prank(creator);
        string[] memory links = new string[](0);
        token = factory.createToken{value: CREATION_FEE}(
            ITokenFactory.TokenParams({
                name: "Test Token",
                symbol: "TEST",
                description: "Test",
                imageUri: "",
                socialLinks: links
            })
        );

        // Fund buyers
        vm.deal(buyer1, 100 ether);
        vm.deal(buyer2, 100 ether);
    }

    // ============================================
    // CURVE PARAMS TESTS
    // ============================================

    function test_CurveParams() public view {
        IBondingCurve.CurveParams memory params = bondingCurve.curveParams();

        assertEq(params.virtualEthReserve, VIRTUAL_ETH);
        assertEq(params.virtualTokenReserve, VIRTUAL_TOKEN);
        assertEq(params.graduationThreshold, GRADUATION_THRESHOLD);
        assertEq(params.feeBps, FEE_BPS);
    }

    function test_InitialTokenState() public view {
        IBondingCurve.TokenState memory state = bondingCurve.getTokenState(token);

        assertEq(state.ethReserve, 0);
        assertEq(state.tokenSupply, 0);
        assertFalse(state.graduated);
        assertEq(state.graduatedAt, 0);
    }

    // ============================================
    // PRICE CALCULATION TESTS
    // ============================================

    function test_GetCurrentPrice_Initial() public view {
        uint256 price = bondingCurve.getCurrentPrice(token);
        // Initial price = virtualEth / virtualToken = 30 / 1B = 3e-8 (scaled to 18 decimals)
        // 30e18 * 1e18 / 1e27 = 30e9
        assertEq(price, 30e9); // 0.00000003 ETH per token
    }

    function test_GetBuyPrice() public view {
        uint256 tokenAmount = 1_000_000 ether; // 1M tokens
        uint256 ethCost = bondingCurve.getBuyPrice(token, tokenAmount);

        // Should cost approximately 0.03 ETH + fees for first million tokens
        // This is based on constant product formula
        assertTrue(ethCost > 0);
        assertTrue(ethCost < 0.1 ether);
    }

    function test_GetSellPrice() public {
        // First buy some tokens
        vm.prank(buyer1);
        uint256 tokensBought = bondingCurve.buy{value: 1 ether}(token, 0);

        // Now check sell price
        uint256 ethReturn = bondingCurve.getSellPrice(token, tokensBought / 2);

        // Should get back roughly half of what we paid minus fees
        assertTrue(ethReturn > 0);
        assertTrue(ethReturn < 1 ether);
    }

    // ============================================
    // BUY TESTS
    // ============================================

    function test_Buy() public {
        vm.startPrank(buyer1);

        uint256 balanceBefore = XfernoToken(token).balanceOf(buyer1);
        assertEq(balanceBefore, 0);

        uint256 tokensBought = bondingCurve.buy{value: 1 ether}(token, 0);

        uint256 balanceAfter = XfernoToken(token).balanceOf(buyer1);
        assertEq(balanceAfter, tokensBought);
        assertTrue(tokensBought > 0);

        vm.stopPrank();
    }

    function test_Buy_UpdatesState() public {
        vm.prank(buyer1);
        uint256 tokensBought = bondingCurve.buy{value: 1 ether}(token, 0);

        IBondingCurve.TokenState memory state = bondingCurve.getTokenState(token);

        assertEq(state.ethReserve, 1 ether);
        assertEq(state.tokenSupply, tokensBought);
        assertFalse(state.graduated);
    }

    function test_Buy_MultipleBuyers() public {
        // First buyer
        vm.prank(buyer1);
        uint256 tokens1 = bondingCurve.buy{value: 1 ether}(token, 0);

        // Second buyer - should get fewer tokens due to price increase
        vm.prank(buyer2);
        uint256 tokens2 = bondingCurve.buy{value: 1 ether}(token, 0);

        // First buyer gets more tokens for same ETH (earlier = cheaper)
        assertTrue(tokens1 > tokens2);
    }

    function test_Buy_SlippageProtection() public {
        // Try to buy with unrealistic min tokens
        vm.prank(buyer1);
        vm.expectRevert(BondingCurve.SlippageExceeded.selector);
        bondingCurve.buy{value: 1 ether}(token, type(uint256).max);
    }

    function test_Buy_EmitsEvent() public {
        vm.prank(buyer1);

        vm.expectEmit(true, true, false, false);
        emit IBondingCurve.TokensBought(buyer1, token, 1 ether, 0, 0);

        bondingCurve.buy{value: 1 ether}(token, 0);
    }

    // ============================================
    // SELL TESTS
    // ============================================

    function test_Sell() public {
        // First buy tokens
        vm.startPrank(buyer1);
        uint256 tokensBought = bondingCurve.buy{value: 2 ether}(token, 0);

        // Approve bonding curve to burn tokens
        XfernoToken(token).approve(address(bondingCurve), tokensBought);

        uint256 ethBefore = buyer1.balance;

        // Sell half
        uint256 tokensToSell = tokensBought / 2;
        uint256 ethReceived = bondingCurve.sell(token, tokensToSell, 0);

        uint256 ethAfter = buyer1.balance;
        assertEq(ethAfter - ethBefore, ethReceived);
        assertTrue(ethReceived > 0);

        // Check token balance reduced
        assertEq(XfernoToken(token).balanceOf(buyer1), tokensBought - tokensToSell);

        vm.stopPrank();
    }

    function test_Sell_UpdatesState() public {
        vm.startPrank(buyer1);

        uint256 tokensBought = bondingCurve.buy{value: 2 ether}(token, 0);
        XfernoToken(token).approve(address(bondingCurve), tokensBought);

        IBondingCurve.TokenState memory stateBefore = bondingCurve.getTokenState(token);

        bondingCurve.sell(token, tokensBought / 2, 0);

        IBondingCurve.TokenState memory stateAfter = bondingCurve.getTokenState(token);

        assertTrue(stateAfter.ethReserve < stateBefore.ethReserve);
        assertTrue(stateAfter.tokenSupply < stateBefore.tokenSupply);

        vm.stopPrank();
    }

    function test_Sell_SlippageProtection() public {
        vm.startPrank(buyer1);

        uint256 tokensBought = bondingCurve.buy{value: 1 ether}(token, 0);
        XfernoToken(token).approve(address(bondingCurve), tokensBought);

        vm.expectRevert(BondingCurve.SlippageExceeded.selector);
        bondingCurve.sell(token, tokensBought, type(uint256).max);

        vm.stopPrank();
    }

    function test_Sell_EmitsEvent() public {
        vm.startPrank(buyer1);

        uint256 tokensBought = bondingCurve.buy{value: 1 ether}(token, 0);
        XfernoToken(token).approve(address(bondingCurve), tokensBought);

        vm.expectEmit(true, true, false, false);
        emit IBondingCurve.TokensSold(buyer1, token, tokensBought, 0, 0);

        bondingCurve.sell(token, tokensBought, 0);

        vm.stopPrank();
    }

    // ============================================
    // GRADUATION TESTS
    // ============================================

    function test_CanGraduate_BelowThreshold() public view {
        assertFalse(bondingCurve.canGraduate(token));
    }

    function test_CanGraduate_AtThreshold() public {
        // Buy enough to reach threshold
        vm.deal(buyer1, 100 ether);
        vm.prank(buyer1);
        bondingCurve.buy{value: 70 ether}(token, 0); // Above 69 ETH threshold

        assertTrue(bondingCurve.canGraduate(token));
    }

    function test_Graduate_AutoOnBuy() public {
        // Buy enough to trigger graduation
        vm.deal(buyer1, 100 ether);
        vm.prank(buyer1);
        bondingCurve.buy{value: 70 ether}(token, 0);

        IBondingCurve.TokenState memory state = bondingCurve.getTokenState(token);
        assertTrue(state.graduated);
        assertTrue(state.graduatedAt > 0);
    }

    function test_Buy_AfterGraduation_Reverts() public {
        // Graduate the token
        vm.deal(buyer1, 100 ether);
        vm.prank(buyer1);
        bondingCurve.buy{value: 70 ether}(token, 0);

        // Try to buy more
        vm.prank(buyer2);
        vm.expectRevert(BondingCurve.AlreadyGraduated.selector);
        bondingCurve.buy{value: 1 ether}(token, 0);
    }

    function test_Sell_AfterGraduation_Reverts() public {
        vm.startPrank(buyer1);

        // Buy tokens
        vm.deal(buyer1, 100 ether);
        uint256 tokensBought = bondingCurve.buy{value: 70 ether}(token, 0);
        XfernoToken(token).approve(address(bondingCurve), tokensBought);

        // Token is now graduated, try to sell
        vm.expectRevert(BondingCurve.AlreadyGraduated.selector);
        bondingCurve.sell(token, tokensBought, 0);

        vm.stopPrank();
    }

    function test_Graduate_EmitsEvent() public {
        vm.deal(buyer1, 100 ether);
        vm.prank(buyer1);

        vm.expectEmit(true, true, false, false);
        emit IBondingCurve.TokenGraduated(token, address(0), 0, 0);

        bondingCurve.buy{value: 70 ether}(token, 0);
    }

    // ============================================
    // ADMIN TESTS
    // ============================================

    function test_SetDexFactory() public {
        address newFactory = makeAddr("newFactory");

        vm.prank(owner);
        bondingCurve.setDexFactory(newFactory);

        assertEq(bondingCurve.dexFactory(), newFactory);
    }

    function test_SetDexFactory_NotOwner() public {
        vm.prank(buyer1);
        vm.expectRevert();
        bondingCurve.setDexFactory(makeAddr("new"));
    }

    function test_SetFeeRecipient() public {
        address newRecipient = makeAddr("newRecipient");

        vm.prank(owner);
        bondingCurve.setFeeRecipient(newRecipient);

        assertEq(bondingCurve.feeRecipient(), newRecipient);
    }

    function test_UpdateCurveParams() public {
        IBondingCurve.CurveParams memory newParams = IBondingCurve.CurveParams({
            virtualEthReserve: 50 ether,
            virtualTokenReserve: 2_000_000_000 ether,
            graduationThreshold: 100 ether,
            feeBps: 200
        });

        vm.prank(owner);
        bondingCurve.updateCurveParams(newParams);

        IBondingCurve.CurveParams memory params = bondingCurve.curveParams();
        assertEq(params.virtualEthReserve, 50 ether);
        assertEq(params.graduationThreshold, 100 ether);
        assertEq(params.feeBps, 200);
    }

    // ============================================
    // FUZZ TESTS
    // ============================================

    function testFuzz_Buy_NonZeroReturn(uint256 ethAmount) public {
        ethAmount = bound(ethAmount, 0.001 ether, 50 ether);

        vm.deal(buyer1, ethAmount);
        vm.prank(buyer1);
        uint256 tokensBought = bondingCurve.buy{value: ethAmount}(token, 0);

        assertTrue(tokensBought > 0);
    }

    function testFuzz_BuyThenSell_NoProfit(uint256 ethAmount) public {
        ethAmount = bound(ethAmount, 0.01 ether, 30 ether);

        vm.deal(buyer1, ethAmount);
        vm.startPrank(buyer1);

        uint256 tokensBought = bondingCurve.buy{value: ethAmount}(token, 0);
        XfernoToken(token).approve(address(bondingCurve), tokensBought);

        uint256 ethReturned = bondingCurve.sell(token, tokensBought, 0);

        // Due to fees, should get back less than paid
        assertTrue(ethReturned < ethAmount);

        vm.stopPrank();
    }

    function testFuzz_PriceIncreasesWithSupply(uint256 amount1, uint256 amount2) public {
        amount1 = bound(amount1, 0.1 ether, 10 ether);
        amount2 = bound(amount2, 0.1 ether, 10 ether);

        vm.deal(buyer1, amount1 + amount2);
        vm.startPrank(buyer1);

        // First buy
        uint256 tokens1 = bondingCurve.buy{value: amount1}(token, 0);
        uint256 price1 = bondingCurve.getCurrentPrice(token);

        // Second buy
        bondingCurve.buy{value: amount2}(token, 0);
        uint256 price2 = bondingCurve.getCurrentPrice(token);

        // Price should increase
        assertTrue(price2 > price1);

        vm.stopPrank();
    }
}
