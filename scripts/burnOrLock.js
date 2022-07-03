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

module.exports = burnOrLock = async (from, amount) => {
	// TODO: Avax Bridge için burn'lemeden önce allowence ver
	let provider;
	let signer;
	let bridgeContract;
	if (from === "avax") {
		provider = new ethers.providers.JsonRpcProvider(rpcUrls.avax);
		signer = new ethers.Wallet(process.env.BRIDGE_USER_PRIVATE_KEY, provider);
		const tokenContract = new ethers.Contract(
			AVAX_TOKEN_ADDRESS,
			AVAX_TOKEN_ABI,
			signer
		);

		// Approve bridge to use the token of the sender
		const approveTx = await tokenContract.approve(
			AVAX_BRIDGE_ADDRESS,
			ethers.utils.parseEther(amount)
		);
		await approveTx.wait();

		bridgeContract = new ethers.Contract(
			AVAX_BRIDGE_ADDRESS,
			AVAX_BRIDGE_ABI,
			signer
		);
		const lockTx = await bridgeContract.lock(
			signer.address,
			ethers.utils.parseEther(amount)
		);
		const minedTx = await lockTx.wait();
		console.log("Successfully locked amount on avax: ", amount);
		console.log("At block: ", minedTx.blockNumber);
		const newUserBalance = await tokenContract.balanceOf(signer.address);
		const newBridgeBalance = await tokenContract.balanceOf(AVAX_BRIDGE_ADDRESS);
		console.log(
			"Updated balance of user after burn: ",
			ethers.utils.formatEther(newUserBalance)
		);
		console.log(
			"Updated balance of bridge after burn: ",
			ethers.utils.formatEther(newBridgeBalance)
		);
	} else if (from === "subnet") {
		provider = new ethers.providers.JsonRpcProvider(rpcUrls.subnet);
		signer = new ethers.Wallet(process.env.BRIDGE_USER_PRIVATE_KEY, provider);
		bridgeContract = new ethers.Contract(
			SUBNET_BRIDGE_ADDRESS,
			SUBNET_BRIDGE_ABI,
			signer
		);
		const burnTx = await bridgeContract.burn(signer.address, {
			value: ethers.utils.parseEther(amount),
		});
		await burnTx.wait();
		console.log("Successfully burned amount on subnet: ", amount);

		const newUserBalance = await signer.getBalance();
		console.log(
			"Updated balance of user after burn: ",
			ethers.utils.formatEther(newUserBalance)
		);
	} else {
		return;
	}
};
