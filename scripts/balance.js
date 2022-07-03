const { ethers } = require("ethers");
const dotenv = require("dotenv");

const rpcUrls = require("../constants/rpcUrls");
const {
	AVAX_TOKEN_ADDRESS,
	AVAX_BRIDGE_ADDRESS,
} = require("../variables/contractAddresses");
const AVAX_TOKEN_ABI =
	require("../artifacts/contracts/Token/AvaxToken.sol/AvaxToken").abi;
dotenv.config();

module.exports = balance = async (from) => {
	let provider;
	let signer;
	let contract;
	if (from === "avax") {
		provider = new ethers.providers.JsonRpcProvider(rpcUrls.avax);
		signer = new ethers.Wallet(process.env.BRIDGE_USER_PRIVATE_KEY, provider);
		contract = new ethers.Contract(AVAX_TOKEN_ADDRESS, AVAX_TOKEN_ABI, signer);
		const newUserBalance = await contract.balanceOf(signer.address);
		const newBridgeBalance = await contract.balanceOf(AVAX_BRIDGE_ADDRESS);
		console.log(
			"MERC20 balance of the user: ",
			ethers.utils.formatEther(newUserBalance)
		);
		console.log(
			"MERC20 balance of the bridge: ",
			ethers.utils.formatEther(newBridgeBalance)
		);
	} else if (from === "subnet") {
		provider = new ethers.providers.JsonRpcProvider(rpcUrls.subnet);
		signer = new ethers.Wallet(process.env.BRIDGE_USER_PRIVATE_KEY, provider);
		const balance = await signer.getBalance();
		console.log(
			"Native token balance on Subnet: ",
			ethers.utils.formatEther(balance)
		);
	} else {
		return;
	}
};
