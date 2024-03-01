const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const STARTING_PRICE = 1e6;
  const DISCOUNT_RATE = 1n;
  const NFT_ID = 505;

  const [owner] = await ethers.getSigners();

  const NftContract = await ethers.getContractFactory("MockNFT");
  NFT = await NftContract.deploy(owner);
  await NFT.waitForDeployment();

  const NFT_ADDRESS = await NFT.getAddress();

  console.log('NFT created ad address', NFT_ADDRESS);

  await NFT.safeMint(owner, NFT_ID);
  await NFT.approve(owner, NFT_ID);

  const dutchAunctionContract = await ethers.getContractFactory("DutchAuction");
  DutchAuction = await dutchAunctionContract.deploy(STARTING_PRICE, DISCOUNT_RATE, NFT_ADDRESS, NFT_ID);
  await DutchAuction.waitForDeployment();

  console.log('DutchAuction Deployed to ', await DutchAuction.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
