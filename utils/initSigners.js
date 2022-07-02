const { ethers } = require("ethers");
const dotenv = require("dotenv");
dotenv.config();

module.exports = (providers) => {
	const avaxSigner = new ethers.Wallet(process.env.PRIVATE_KEY, providers.avax);
	const subnetSigner = new ethers.Wallet(
		process.env.PRIVATE_KEY,
		providers.subnet
	);
	return { avax: avaxSigner, subnet: subnetSigner };
};
