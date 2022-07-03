const fs = require("fs");
const { ethers } = require("ethers");
const dotenv = require("dotenv");

const {
	SUBNET_NATIVE_MINTER_ADDRESS,
} = require("../constants/nativeMinterAddress");
const AVAX_TOKEN_BYTECODE =
	require("../artifacts/contracts/Token/AvaxToken.sol/AvaxToken").bytecode;
const AVAX_TOKEN_ABI =
	require("../artifacts/contracts/Token/AvaxToken.sol/AvaxToken").abi;
const AVAX_BRIDGE_BYTECODE =
	require("../artifacts/contracts/Bridge/AvaxBridge.sol/AvaxBridge").bytecode;
const AVAX_BRIDGE_ABI =
	require("../artifacts/contracts/Bridge/AvaxBridge.sol/AvaxBridge").abi;
const SUBNET_BRIDGE_BYTECODE =
	require("../artifacts/contracts/Bridge/SubnetBridge.sol/SubnetBridge").bytecode;
const SUBNET_BRIDGE_ABI =
	require("../artifacts/contracts/Bridge/SubnetBridge.sol/SubnetBridge").abi;
const SUBNET_NATIVE_MINTER_ABI =
	require("../artifacts/contracts/Token/INativeMinter.sol/NativeMinterInterface").abi;

const initProviders = require("../utils/initProviders");
const initSigners = require("../utils/initSigners");
dotenv.config();

module.exports = deploy = async () => {
	const providers = initProviders();
	const signers = initSigners(providers);

	// Deploy AvaxToken it gives the total supply of the token to the msg.sender (which is the user that will bridge in our case)
	const AvaxTokenFactory = new ethers.ContractFactory(
		AVAX_TOKEN_ABI,
		AVAX_TOKEN_BYTECODE,
		signers.avax.user
	);
	const avaxToken = await AvaxTokenFactory.deploy("MyErc20", "MERC20");
	await avaxToken.deployTransaction.wait();
	console.log("avax token deployed to: ", avaxToken.address);

	// Deploy AvaxBridge it makes msg.sender the admin of the bridge
	const AvaxBridgeFactory = new ethers.ContractFactory(
		AVAX_BRIDGE_ABI,
		AVAX_BRIDGE_BYTECODE,
		signers.avax.bridgeAdmin
	);
	const avaxBridge = await AvaxBridgeFactory.deploy(avaxToken.address);
	await avaxBridge.deployTransaction.wait();
	console.log("avax bridge deployed to: ", avaxBridge.address);

	// Deploy SubnetBridge it makes msg.sender the admin of the bridge
	const SubnetBridgeFactory = new ethers.ContractFactory(
		SUBNET_BRIDGE_ABI,
		SUBNET_BRIDGE_BYTECODE,
		signers.subnet.bridgeAdmin
	);
	const subnetBridge = await SubnetBridgeFactory.deploy();
	await subnetBridge.deployTransaction.wait();
	console.log("subnet bridge deployed to: ", subnetBridge.address);

	// Enable subnet bridge to mint native coins
	const nativeMinter = new ethers.Contract(
		SUBNET_NATIVE_MINTER_ADDRESS,
		SUBNET_NATIVE_MINTER_ABI,
		signers.subnet.bridgeAdmin
	);
	const setNativeMinterTx = await nativeMinter.setEnabled(subnetBridge.address);
	await setNativeMinterTx.wait();
	console.log("allowed subnet bridge to mint native coins");

	// TODO: Before setting bridge as the admin, mint some tokens for the current address to easily test burning

	fs.writeFileSync(
		"variables/contractAddresses.js",
		`module.exports = {
			AVAX_TOKEN_ADDRESS: "${avaxToken.address}",
			AVAX_BRIDGE_ADDRESS: "${avaxBridge.address}",
			SUBNET_BRIDGE_ADDRESS: "${subnetBridge.address}",
		}`
	);
	console.log(
		"updated contract addresses inside variables/contractAddresses.js"
	);
};
