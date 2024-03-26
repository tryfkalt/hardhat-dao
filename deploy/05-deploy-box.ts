import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import verify from "../helper-functions";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import { ethers } from "hardhat";

const deployBox: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    log("----------------------------------------------------");
    log("Deploying Box and waiting for confirmations...");

    // here the deployer is deploying the Box contract and not the TimeLock contract
    // so we need to transfer the ownership of the Box contract to the TimeLock contract
    const box = await deploy("Box", {
        from: deployer,
        args: [],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    });
    log(`Box at ${box.address}`);
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(box.address, []);
    };
    const boxContract = await ethers.getContractAt("Box", box.address);
    const timeLock = await ethers.getContract("TimeLock");
    const transferTx = await boxContract.transferOwnership(timeLock.address); // transfer ownership to the TimeLock contract
    await transferTx.wait(1);
}

export default deployBox;
deployBox.tags = ["all", "box"];