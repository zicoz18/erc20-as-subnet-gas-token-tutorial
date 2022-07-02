const fs = require("fs");
const { ethers } = require("ethers");
const dotenv = require("dotenv");

const {
	SUBNET_NATIVE_MINTER_ADDRESS,
} = require("../constants/contractAddresses");
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

	// Deploy AvaxToken
	const AvaxTokenFactory = new ethers.ContractFactory(
		AVAX_TOKEN_ABI,
		AVAX_TOKEN_BYTECODE,
		signers.avax
	);
	const avaxToken = await AvaxTokenFactory.deploy("MyErc20", "MERC");
	await avaxToken.deployTransaction.wait();
	console.log("avax token deployed to: ", avaxToken.address);

	// Deploy AvaxBridge
	const AvaxBridgeFactory = new ethers.ContractFactory(
		AVAX_BRIDGE_ABI,
		AVAX_BRIDGE_BYTECODE,
		signers.avax
	);
	const avaxBridge = await AvaxBridgeFactory.deploy(avaxToken.address);
	await avaxBridge.deployTransaction.wait();
	console.log("avax bridge deployed to: ", avaxBridge.address);

	// Deploy SubnetBridge
	const SubnetBridgeFactory = new ethers.ContractFactory(
		SUBNET_BRIDGE_ABI,
		SUBNET_BRIDGE_BYTECODE,
		signers.subnet
	);
	const subnetBridge = await SubnetBridgeFactory.deploy();
	await subnetBridge.deployTransaction.wait();
	console.log("subnet bridge deployed to: ", subnetBridge.address);

	// Enable subnet bridge to mint native coins
	const nativeMinter = new ethers.Contract(
		SUBNET_NATIVE_MINTER_ADDRESS,
		SUBNET_NATIVE_MINTER_ABI,
		signers.subnet
	);
	const setNativeMinterTx = await nativeMinter.setEnabled(subnetBridge.address);
	await setNativeMinterTx.wait();
	console.log("allowed subnet bridge to mint native coins");

	// Set AvaxBridge as the admin of the AvaxToken
	const setAvaxBridgeAsAdminOfAvaxTokenTx = await avaxToken.setAdmin(
		avaxBridge.address
	);
	await setAvaxBridgeAsAdminOfAvaxTokenTx.wait();
	console.log("allowed avax bridge to mint avax tokens by making it the admin");

	fs.writeFileSync(
		"constants/contractAddresses.js",
		`module.exports = {
			AVAX_TOKEN_ADDRESS: "${avaxToken.address}",
			AVAX_BRIDGE_ADDRESS: "${avaxBridge.address}",
			SUBNET_BRIDGE_ADDRESS: "${subnetBridge.address}",
			SUBNET_NATIVE_MINTER_ADDRESS: "0x0200000000000000000000000000000000000001",
		}`
	);
	console.log("Updated contract addresses");
};
