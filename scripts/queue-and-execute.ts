// E.g if the proposal passes, it is queued and executed and the box contract will store the value 55
import { FUNC, MIN_DELAY, NEW_STORE_VALUE, PROPOSAL_DESCRIPTION, developmentChains } from "../helper-hardhat-config";
import { ethers, network } from "hardhat";
import { moveBlocks } from "../utils/move-blocks";
import { moveTime } from "../utils/move-time";

const index = 0;
export async function queueAndExecute() {
    const args = [NEW_STORE_VALUE];
    const box = await ethers.getContract("Box");
    const encodedFunctionCall = box.interface.encodeFunctionData(FUNC, args);
    // all this does is encode the function call so that it can be passed to the propose function
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION));
    const governor = await ethers.getContract("GovernorContract");
    console.log(`Queueing...`);
    const queueTx = await governor.queueTransaction(box.address, [0], [encodedFunctionCall], descriptionHash);
    await queueTx.wait(1);
    // after queueing the transaction, we need to wait a minimum delay before executing it
    if (developmentChains.includes(network.name)) {
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(1);
    }

    console.log(`Executing...`);
    const executeTx = await governor.executeTransaction(box.address, [0], [encodedFunctionCall], descriptionHash);
    await executeTx.wait(1);
    const boxNewValue = await box.retrieve();
    console.log(`New Box Value: ${boxNewValue.toString()}`);
}

queueAndExecute().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});