const { task } = require("hardhat/config");

require("@nomiclabs/hardhat-waffle");
require("./scripts/burnOrLock");
require("./scripts/balance");
require("./scripts/deploy");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

task("burnOrLock", "Burn or lock token from a network")
	.addParam("from", "Network to burn or lock from")
	.addOptionalParam("amount", "Amount to burn or lock")
	.setAction(async (taskArgs, hre) => {
		await burnOrLock(taskArgs.from, taskArgs.amount).catch((error) => {
			console.error(error);
			process.exitCode = 1;
		});
	});

task("balance", "Get token balance from a network")
	.addParam("from", "Network to burn from")
	.setAction(async (taskArgs, hre) => {
		await balance(taskArgs.from).catch((error) => {
			console.error(error);
			process.exitCode = 1;
		});
	});

task(
	"deploy",
	"Deploy bridges on both networks and deploy AvaxToken, also update the admins"
).setAction(async (taskArgs, hre) => {
	await deploy().catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
});

module.exports = {
	solidity: "0.8.7",
	networks: {
		avax: {
			url: "https://api.avax-test.network/ext/bc/C/rpc",
			chainId: 43113,
			accounts:
				process.env.BRIDGE_ADMIN_PRIVATE_KEY !== undefined
					? [process.env.BRIDGE_ADMIN_PRIVATE_KEY]
					: [],
		},
		subnet: {
			url: "http://127.0.0.1:31874/ext/bc/2qA55SY4gNTvmemg74YJQBUBae887m47mNkfMPAAoJnb26m97q/rpc",
			chainId: 707070,
			accounts:
				process.env.BRIDGE_ADMIN_PRIVATE_KEY !== undefined
					? [process.env.BRIDGE_ADMIN_PRIVATE_KEY]
					: [],
		},
	},
};
