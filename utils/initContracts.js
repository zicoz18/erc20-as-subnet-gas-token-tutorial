const { ethers } = require("ethers");
const SUBNET_BRIDGE_ABI =
	require("../artifacts/contracts/Bridge/SubnetBridge.sol/SubnetBridge").abi;
const AVAX_BRIDGE_ABI =
	require("../artifacts/contracts/Bridge/AvaxBridge.sol/AvaxBridge").abi;
const {
	AVAX_BRIDGE_ADDRESS,
	SUBNET_BRIDGE_ADDRESS,
} = require("../variables/contractAddresses");

module.exports = (signers) => {
	const avaxBridgeAdmin = new ethers.Contract(
		AVAX_BRIDGE_ADDRESS,
		AVAX_BRIDGE_ABI,
		signers.avax.bridgeAdmin
	);
	const subnetBridgeAdmin = new ethers.Contract(
		SUBNET_BRIDGE_ADDRESS,
		SUBNET_BRIDGE_ABI,
		signers.subnet.bridgeAdmin
	);
	const avaxBridgeUser = new ethers.Contract(
		AVAX_BRIDGE_ADDRESS,
		AVAX_BRIDGE_ABI,
		signers.avax.user
	);
	const subnetBridgeUser = new ethers.Contract(
		SUBNET_BRIDGE_ADDRESS,
		SUBNET_BRIDGE_ABI,
		signers.subnet.user
	);
	return {
		avax: { bridge: avaxBridgeAdmin, user: avaxBridgeUser },
		subnet: { bridge: subnetBridgeAdmin, user: subnetBridgeUser },
	};
};
