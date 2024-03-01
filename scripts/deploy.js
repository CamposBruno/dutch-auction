const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const STARTING_PRICE = 1e6;
  const DISCOUNT_RATE = 1n;
  
  let NFT_ADDRESS = process.env.NFT_ADDRESS;
  let NFT_ID = process.env.NFT_ID;
  
  // In Order for this auction to work, you must provide a valid NFT contract address and 
  // a NFT id owned by the seller. If you do not have it uncomment this section if you want
  // to deploy a new NFT contract and mint an empty NFT in order to test the contract.
  
  // const [owner] = await ethers.getSigners();
  // const NftContract = await ethers.getContractFactory("MockNFT");
  // NFT = await NftContract.deploy(owner);
  // await NFT.waitForDeployment();

  // NFT_ADDRESS = await NFT.getAddress();
  // NFT_ID = 505;

  // await NFT.safeMint(owner, NFT_ID);
  // console.log(`NFT ${NFT_ID} created with address ${NFT_ADDRESS}`);
  
  const dutchAunctionContract = await ethers.getContractFactory("DutchAuction");
  DutchAuction = await dutchAunctionContract.deploy(STARTING_PRICE, DISCOUNT_RATE, NFT_ADDRESS, NFT_ID);
  await DutchAuction.waitForDeployment();

  // If you uncommented the previous section, do not forget to uncomment this section as well.
  
  // const auctionAddress = await DutchAuction.getAddress();
  // await NFT.approve(auctionAddress, NFT_ID);

  // console.log('DutchAuction Deployed to ', await DutchAuction.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
