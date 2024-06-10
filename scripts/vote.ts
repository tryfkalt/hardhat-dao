// E.g voting on a proposal to change the box contract value to 55
// if it passes we queue it and then execute it
import { ethers, network } from "hardhat";
import { VOTING_PERIOD, developmentChains, proposalsFile } from "../helper-hardhat-config";
import * as fs from "fs";
import { moveBlocks } from "../utils/move-blocks";

async function main() {
    const proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"))
    // You could swap this out for the ID you want to use too
    const proposalId = proposals[network.config.chainId!].at(-1);
    // 0 is against, 1 is for and 2 is abstain
    const voteWay = 1
    const reason = "I like this proposal!"
    await vote(proposalId, voteWay, reason)
}

// 0 = Against, 1 = For, 2 = Abstain for this example
export async function vote(proposalId: string, voteWay: number, reason: string) {
    console.log("Voting...")
    const governor = await ethers.getContract("GovernorContract")
    console.log(proposalId, voteWay, reason)
    const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason)
    const voteTxReceipt = await voteTx.wait(1)
    console.log(voteTxReceipt.events[0].args.reason)
    const proposalState = await governor.state(proposalId)
    console.log(`Current Proposal State: ${proposalState}`)
    // We are on local network so we can move blocks/vote
    if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_PERIOD + 1)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })