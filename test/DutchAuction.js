const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DutchAuction", function () {
  const DURATION = 3600 * 24 * 7 // seven days
  const STARTING_PRICE = 1e6;
  const DISCOUNT_RATE = 1n;
  const NFT_ID = 505;
  
  let NFT;
  let NFT_ADDRESS;
  let DutchAuction;
  let owner;

  const skip = (timeInSeconds) => {
    ethers.provider.send("evm_increaseTime", [timeInSeconds]);
    ethers.provider.send("evm_mine");
  }

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();


    const MockNFT = await ethers.getContractFactory("MockNFT");
    NFT = await MockNFT.deploy(owner);
    await NFT.waitForDeployment();

    NFT_ADDRESS = await NFT.getAddress();

    await NFT.safeMint(owner, NFT_ID);
    
    // Deploy and initialize DutchAuction contract
    const dutchAunctionContract = await ethers.getContractFactory("DutchAuction");
    DutchAuction = await dutchAunctionContract.deploy(NFT_ADDRESS, NFT_ID, STARTING_PRICE, DISCOUNT_RATE, DURATION);
    await DutchAuction.waitForDeployment();
    
    await NFT.approve(await DutchAuction.getAddress(), NFT_ID);

  });

  describe("getPrice", () => {
    it("Should decrease value of NFT over time", async function () {
      const startingPrice = await DutchAuction.getPrice();
      skip(3600);
      expect(await DutchAuction.getPrice()).eq(startingPrice - 3600n * DISCOUNT_RATE);
      skip(3600);
      expect(await DutchAuction.getPrice()).eq(startingPrice - 7200n * DISCOUNT_RATE);
    });
  })

  describe("buy", () => {
    it("Should not execute buy after auction ended by time", async function () {
      skip(3600 * 24 * 7); // seven days

      await expect(DutchAuction.buy({ value : ethers.parseEther('1') }))
        .to.be.revertedWith('Auction expired');
    });

    it("Should not execute buy after auction ended by sold", async function () {
      skip(3600 * 24 * 1); // one day
      const currentPrice = await DutchAuction.getPrice();

      await DutchAuction.buy({ value : currentPrice });

      await expect(DutchAuction.buy({ value : currentPrice }))
        .to.be.revertedWith('Auction ended');

      await expect(DutchAuction.closeAuction())
        .to.be.revertedWith('Auction already ended');
    });

    it("Should revert if ETH sent is less than current price", async function () {
      const currentPrice = await DutchAuction.getPrice();
      const amountSent = currentPrice - 10n;

      await expect(DutchAuction.buy({ value : amountSent  }))
        .to.be.revertedWith('Send more ether');
    });

    it("Should sell NFT and refund buyer with proper values", async function () {
      const previousPrice = await DutchAuction.getPrice();
      skip(3600 * 24 * 1); // one day
      const currentPrice = await DutchAuction.getPrice();
      const overflow = previousPrice - currentPrice;

      expect(await NFT.ownerOf(NFT_ID)).eq(owner);

      const sellerBalanceBefore = await ethers.provider.getBalance(owner);
      
      await expect(DutchAuction.connect(addr1).buy({ value : previousPrice }))
        .to.emit(DutchAuction, "Bought").withArgs(addr1, currentPrice - 1n, overflow + 1n); // 1n refers to 1 milisecond ellapsed running the test

        const sellerBalanceAfter = await ethers.provider.getBalance(owner);

      expect(await NFT.ownerOf(NFT_ID)).eq(addr1);
      expect(sellerBalanceAfter).eq(sellerBalanceBefore + currentPrice - 1n);
    });
  });

  describe("closeAuction", () => {
    it("Should revert if not called by seller", async function () {
      await expect(DutchAuction.connect(addr1).closeAuction())
        .to.be.revertedWith('Only seller can end auction');
    });

    it("Should revert if attempt to close auction before expiration", async function () {
      await expect(DutchAuction.connect(owner).closeAuction())
        .to.be.revertedWith('Too soon to close auction');
    });

    it("Should end auction after expiration", async function () {
      skip(DURATION) // seven days;
      const closeAuction = await DutchAuction.connect(owner).closeAuction();

      expect(closeAuction).to.emit(DutchAuction, "Closed");
    });
  });

  describe("fallback", () => { 
    it("Should revert if attempt to call direclty", async function () {
      const auctionAddress = await DutchAuction.getAddress();

      await expect(owner.sendTransaction({ 
        to: auctionAddress,
        value: ethers.parseEther('1'),
        data : ethers.randomBytes(10),
      })).to.be.revertedWith("cannot call directly");
    });
  });
});
