const { ethers } = require("ethers");
const dotenv = require("dotenv");

const rpcUrls = require("../constants/rpcUrls");
const {
	AVAX_BRIDGE_ADDRESS,
	AVAX_TOKEN_ADDRESS,
	SUBNET_BRIDGE_ADDRESS,
} = require("../variables/contractAddresses");
const SUBNET_BRIDGE_ABI =
	require("../artifacts/contracts/Bridge/SubnetBridge.sol/SubnetBridge").abi;
const AVAX_BRIDGE_ABI =
	require("../artifacts/contracts/Bridge/AvaxBridge.sol/AvaxBridge").abi;
const AVAX_TOKEN_ABI =
	require("../artifacts/contracts/Token/AvaxToken.sol/AvaxToken").abi;
dotenv.config();

module.exports = burn = async (from, amount) => {
	let provider;
	let signer;
	let contract;
	if (from === "avax") {
		provider = new ethers.providers.JsonRpcProvider(rpcUrls.avax);
		signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
		contract = new ethers.Contract(
			AVAX_BRIDGE_ADDRESS,
			AVAX_BRIDGE_ABI,
			signer
		);
		const burnTx = await contract.burn(
			signer.address,
			ethers.utils.parseEther(amount)
		);
		await burnTx.wait();
		console.log("Successfully burned amount on avax: ", amount);
		const tokenContract = new ethers.Contract(
			AVAX_TOKEN_ADDRESS,
			AVAX_TOKEN_ABI,
			signer
		);
		const newBalance = await tokenContract.balanceOf(signer.address);
		console.log(
			"Updated balance after burn: ",
			ethers.utils.formatEther(newBalance)
		);
	} else if (from === "subnet") {
		provider = new ethers.providers.JsonRpcProvider(rpcUrls.subnet);
		signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
		contract = new ethers.Contract(
			SUBNET_BRIDGE_ADDRESS,
			SUBNET_BRIDGE_ABI,
			signer
		);
		const burnTx = await contract.burn(signer.address, {
			value: ethers.utils.parseEther(amount),
		});
		await burnTx.wait();
		console.log("Successfully burned amount on subnet: ", amount);

		const newBalance = await signer.getBalance();
		console.log(
			"Updated balance after burn: ",
			ethers.utils.formatEther(newBalance)
		);
	} else {
		return;
	}
};
