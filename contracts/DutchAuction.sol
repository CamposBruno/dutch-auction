// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// @Author: Bruno Campos
// @github: https://github.com/CamposBruno
contract DutchAuction {
    uint256 private constant DURATION = 7 days;

    IERC721 public immutable nft;
    uint256 public immutable nftId;

    address payable public immutable seller;
    uint256 public immutable startingPrice;
    uint256 public immutable startAt;
    uint256 public immutable expiresAt;
    uint256 public immutable discountRate;

    event Bought(address buyer, uint256 amount, uint256 refunded);
    event Closed();

    constructor(
        uint256 _startingPrice,
        uint256 _discountRate,
        address _nft,
        uint256 _nftId
    ) {
        seller = payable(msg.sender);
        startingPrice = _startingPrice;
        startAt = block.timestamp;
        expiresAt = block.timestamp + DURATION;
        discountRate = _discountRate;

        require(
            _startingPrice >= _discountRate * DURATION, "starting price < min"
        );

        nft = IERC721(_nft);
        nftId = _nftId;
    }

    function getPrice() public view returns (uint256) {
        // Code here
        uint256 timeElapsed = block.timestamp - startAt;
        uint256 currentPrice = startingPrice - (discountRate * timeElapsed);
        
        return currentPrice;
    }

    function buy() external payable {
        // Code here
        require(block.timestamp < expiresAt, "Auction expired");
        require(msg.value >= getPrice(), "Send more ether");

        uint256 currentPrice = getPrice();
        uint256 refundAmount = msg.value - currentPrice;
        
        nft.transferFrom(seller, msg.sender, nftId);
        
        // refund buyer if eth sent greater then current price;
        if (refundAmount > 0) {
            (bool success,) = payable(msg.sender).call{ value : refundAmount }("");
            require(success, "Error refunding buyer");
        }
        
        selfdestruct(seller);
        
        emit Bought(msg.sender, currentPrice, refundAmount);
    }

    function closeAuction() external {
        require(msg.sender == seller, "Only seller can end auction");
        require(block.timestamp > expiresAt, "Too soon to close auction");
        
        selfdestruct(seller);
        
        emit Closed();
    }
}
