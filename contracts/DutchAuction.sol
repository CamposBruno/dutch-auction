// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// @Author: Bruno Campos
// @github: https://github.com/CamposBruno
contract DutchAuction {
    IERC721 public immutable nft;
    uint256 public immutable nftId;

    bool public ended;
    address payable public immutable seller;
    uint256 public immutable startingPrice;
    uint256 public immutable startAt;
    uint256 public immutable expiresAt;
    uint256 private immutable discountRate;
    uint256 private immutable duration;

    event Bought(address buyer, uint256 amount, uint256 refunded);
    event Closed();

    constructor(
        address _nft,
        uint256 _nftId,
        uint256 _startingPrice,
        uint256 _discountRate,
        uint256 _duration
    ) {
        seller = payable(msg.sender);
        startingPrice = _startingPrice;
        startAt = block.timestamp;
        duration = _duration;
        expiresAt = block.timestamp + duration;
        discountRate = _discountRate;
        ended = false;

        require(
            _startingPrice >= _discountRate * duration, "starting price < min"
        );

        nft = IERC721(_nft);
        nftId = _nftId;
    }

    function getPrice() public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - startAt;
        uint256 currentPrice = startingPrice - (discountRate * timeElapsed);
        
        return currentPrice;
    }

    function buy() external payable {
        require(block.timestamp < expiresAt, "Auction expired");
        require(msg.value >= getPrice(), "Send more ether");
        require(!ended, "Auction ended");

        ended = true;
        
        nft.transferFrom(seller, msg.sender, nftId);

        uint256 currentPrice = getPrice();
        uint256 refundAmount = msg.value - currentPrice;
        
        // refund buyer if eth sent greater then current price;
        if (refundAmount > 0) {
            (bool refund,) = payable(msg.sender).call{ value : refundAmount }("");
            require(refund, "Error refunding buyer");
        }    
        
        (bool paySeller,) = seller.call{ value : currentPrice }("");
        require(paySeller, "Error paying seller");

        emit Bought(msg.sender, currentPrice, refundAmount);
    }

    function closeAuction() external {
        require(msg.sender == seller, "Only seller can end auction");
        require(!ended, "Auction already ended");
        require(block.timestamp > expiresAt, "Too soon to close auction");

        ended = true;
                
        (bool paySeller,) = seller.call{ value : address(this).balance }("");
        require(paySeller, "Error paying seller");

        emit Closed();
    }

    receive() payable external {
        revert("cannot send ETH directly");
    }

    fallback() payable external {
        revert("cannot call directly");
    }
}
