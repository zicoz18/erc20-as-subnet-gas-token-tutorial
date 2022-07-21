const { ethers } = require("ethers");
const dotenv = require("dotenv");
dotenv.config();

module.exports = (providers) => {
	/* 
		Since we will have a bridge admin account to deploy and interact with bridges
   		and a user account that is using the bridge.
   		We have 2 different accounts to interact with bridges on 2 different chains
   		Therefore, we have to create 4 wallets
	 */
	const avaxBridgeAdmin = new ethers.Wallet(
		process.env.BRIDGE_ADMIN_PRIVATE_KEY,
		providers.avax
	);
	const avaxBridgeUser = new ethers.Wallet(
		process.env.BRIDGE_USER_PRIVATE_KEY,
		providers.avax
	);
	const subnetBridgeAdmin = new ethers.Wallet(
		process.env.BRIDGE_ADMIN_PRIVATE_KEY,
		providers.subnet
	);
	const subnetBridgeUser = new ethers.Wallet(
		process.env.BRIDGE_USER_PRIVATE_KEY,
		providers.subnet
	);
	return {
		avax: { admin: avaxBridgeAdmin, user: avaxBridgeUser },
		subnet: { admin: subnetBridgeAdmin, user: subnetBridgeUser },
	};
};
