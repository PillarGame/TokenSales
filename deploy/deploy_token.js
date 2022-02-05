const hre = require("hardhat");
const { ethers, upgrades, artifacts} = require("hardhat");
const NAME = "V3 A TOKEN";
const SYMBOL = "V3A";

async function main() {
    console.log('Running deploy script');

     const tokenFactory = await hre.ethers.getContractFactory("ProjectToken");
    const aToken = await tokenFactory.deploy(NAME,SYMBOL);
    await aToken.deployed();
    console.log("aToken deployed to:", aToken.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
