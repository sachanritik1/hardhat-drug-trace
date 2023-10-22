const { network } = require("hardhat")
const {
	developmentChains,
	VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify.js")

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	const waitBlockConfirmations = VERIFICATION_BLOCK_CONFIRMATIONS || 1
	log(
		"--------------------------------------------------------------------------------------------"
	)

	const args = []
	const supplyChain = await deploy("SupplyChain", {
		from: deployer,
		args: args,
		log: true,
		waitConfirmation: waitBlockConfirmations,
	})

	if (
		!developmentChains.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		await verify(supplyChain.address, args)
	}

	log(
		"--------------------------------------------------------------------------------------------"
	)
}
module.exports.tags = ["all", "supplychain"]
