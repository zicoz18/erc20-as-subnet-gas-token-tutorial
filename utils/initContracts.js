const { ethers } = require("ethers");
const SUBNET_BRIDGE_ABI =
	require("../artifacts/contracts/Bridge/SubnetBridge.sol/SubnetBridge").abi;
const AVAX_BRIDGE_ABI =
	require("../artifacts/contracts/Bridge/AvaxBridge.sol/AvaxBridge").abi;
const {
	AVAX_BRIDGE_ADDRESS,
	SUBNET_BRIDGE_ADDRESS,
} = require("../constants/contractAddresses");

module.exports = (signers) => {
	const avaxBridge = new ethers.Contract(
		AVAX_BRIDGE_ADDRESS,
		AVAX_BRIDGE_ABI,
		signers.avax
	);
	const subnetBridge = new ethers.Contract(
		SUBNET_BRIDGE_ADDRESS,
		SUBNET_BRIDGE_ABI,
		signers.subnet
	);
	return { avax: avaxBridge, subnet: subnetBridge };
};
