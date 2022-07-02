const { ethers } = require("ethers");
const rpcUrls = require("../constants/rpcUrls");

module.exports = () => {
	const avaxProvider = new ethers.providers.JsonRpcProvider(rpcUrls.avax);
	const subnetProvider = new ethers.providers.JsonRpcProvider(rpcUrls.subnet);
	return { avax: avaxProvider, subnet: subnetProvider };
};
