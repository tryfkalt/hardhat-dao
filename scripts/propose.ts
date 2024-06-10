// E.g propose that the box contract stores the value 55
// On Compound, the proposal is the same as the Created  
import { ethers, network } from "hardhat";
import { NEW_STORE_VALUE, FUNC, PROPOSAL_DESCRIPTION, developmentChains, VOTING_DELAY, proposalsFile } from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-blocks";
import * as fs from "fs";

export async function propose(args: any[], functionToCall: string, proposalDescription: string) {
    const governor = await ethers.getContract("GovernorContract");
    const box = await ethers.getContract("Box");
    // this is the calldata on the propose function
    const encodedFunctionCall = box.interface.encodeFunctionData(functionToCall, args);
    console.log(`Proposing ${functionToCall} on ${box.address} with args: ${args}`);
    console.log(`Proposal description: \n ${PROPOSAL_DESCRIPTION}`);
    const proposeTx = await governor.propose([box.address], [0], [encodedFunctionCall], proposalDescription);
    // propose has 4 arguments, the first is the target, the second is the value, the third is the calldata, and the fourth is the description
    // the target is the address of the contract that you want to call the function on
    // the value is the amount of ether you want to send with the transaction
    // the calldata is the encoded function call
    // the description is the description of the proposal

    if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_DELAY + 1);
        // VOTING_DELAY is the number of blocks that need to pass before voting can begin
    }
    const proposeReceipt = await proposeTx.wait(1);
    const proposalId = proposeReceipt.events![0].args!.proposalId;
    // the proposalId is the id of the proposal that was just created
    const proposalState = await governor.state(proposalId);
    // the state of the proposal is the current state of the proposal. It can be 0 (Pending), 1 (Active), 2 (Canceled), 3 (Defeated), 4 (Succeeded), 5 (Queued), 6 (Expired), 7 (Executed)
    const proposalSnapShot = await governor.proposalSnapshot(proposalId);
    // the proposal snapshot is the block number at which the proposal was created
    const proposalDeadline = await governor.proposalDeadline(proposalId);
    // the proposal deadline is the block number at which the proposal will expire
    // save the proposalId
    storeProposalId(proposalId);

    // the Proposal State is an enum data type, defined in the IGovernor contract.
    // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
    console.log(`Current Proposal State: ${proposalState}`)
    // What block # the proposal was snapshot
    console.log(`Current Proposal Snapshot: ${proposalSnapShot}`)
    // The block number the proposal voting expires
    console.log(`Current Proposal Deadline: ${proposalDeadline}`)
}

function storeProposalId(proposalId: any) {
    const chainId = network.config.chainId!.toString();
    let proposals: any;

    if (fs.existsSync(proposalsFile)) {
        proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
    } else {
        proposals = {};
        proposals[chainId] = [];
    }
    proposals[chainId].push(proposalId.toString());
    fs.writeFileSync(proposalsFile, JSON.stringify(proposals), "utf8");
}



propose([NEW_STORE_VALUE], FUNC, PROPOSAL_DESCRIPTION).then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});