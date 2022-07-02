const { ethers } = require("ethers");
const dotenv = require("dotenv");

const rpcUrls = require("../constants/rpcUrls");
const { AVAX_TOKEN_ADDRESS } = require("../constants/contractAddresses");
const AVAX_TOKEN_ABI =
	require("../artifacts/contracts/Token/AvaxToken.sol/AvaxToken").abi;
dotenv.config();

module.exports = balance = async (from) => {
	let provider;
	let signer;
	let contract;
	if (from === "avax") {
		provider = new ethers.providers.JsonRpcProvider(rpcUrls.avax);
		signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
		contract = new ethers.Contract(AVAX_TOKEN_ADDRESS, AVAX_TOKEN_ABI, signer);
		const balance = await contract.balanceOf(signer.address);
		console.log(
			"AvaxToken balance on Avax: ",
			ethers.utils.formatEther(balance)
		);
	} else if (from === "subnet") {
		provider = new ethers.providers.JsonRpcProvider(rpcUrls.subnet);
		signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
		const balance = await signer.getBalance();
		console.log(
			"Native token balance on Subnet: ",
			ethers.utils.formatEther(balance)
		);
	} else {
		return;
	}
};
