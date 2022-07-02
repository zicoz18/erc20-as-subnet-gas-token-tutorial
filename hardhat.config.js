const { task } = require("hardhat/config");

require("@nomiclabs/hardhat-waffle");
require("./scripts/burn");
require("./scripts/balance");
require("./scripts/deploy");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

task("burn", "Burn token from a network")
	.addParam("from", "Network to burn from")
	.addOptionalParam("amount", "Amount to burn")
	.setAction(async (taskArgs, hre) => {
		await burn(taskArgs.from, taskArgs.amount).catch((error) => {
			console.error(error);
			process.exitCode = 1;
		});
	});

task("balance", "Get token balance from a network")
	.addParam("from", "Network to burn from")
	.setAction(async (taskArgs, hre) => {
		await balance(taskArgs.from, taskArgs.amount).catch((error) => {
			console.error(error);
			process.exitCode = 1;
		});
	});

task(
	"deploy",
	"Deploy bridges on both networks and deploy AvaxToken, also update the admins"
).setAction(async (taskArgs, hre) => {
	await deploy(taskArgs.from, taskArgs.amount).catch((error) => {
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
				process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
		},
		subnet: {
			url: "http://127.0.0.1:31874/ext/bc/2qA55SY4gNTvmemg74YJQBUBae887m47mNkfMPAAoJnb26m97q/rpc",
			chainId: 707070,
			accounts:
				process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
		},
	},
};
