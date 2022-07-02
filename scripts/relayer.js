const { ethers } = require("ethers");
const dotenv = require("dotenv");

const initProviders = require("../utils/initProviders");
const initSigners = require("../utils/initSigners");
const initContracts = require("../utils/initContracts");

dotenv.config();

const main = async () => {
	const providers = initProviders();
	const signers = initSigners(providers);
	const bridgeContracts = initContracts(signers);
	let txs = [];

	bridgeContracts.avax.on(
		"Transfer",
		async (from, to, amount, date, nonce, step) => {
			if (step === 1) {
				// step 1 means burn
				console.log("Burned happened on avax, will mint in subnet ");
				console.log(
					`Transfer: from: ${from}, to: ${to}, amount: ${amount}, date: ${date}, nonce: ${nonce}, step: ${step}`
				);
				const isProccessed = await bridgeContracts.subnet.processedNonces(
					nonce
				);
				if (!isProccessed) {
					console.log("is not processed already");
					txs.push({ chain: "subnet", from, amount, nonce });
				}
			}
		}
	);

	bridgeContracts.subnet.on(
		"Transfer",
		async (from, to, amount, date, nonce, step) => {
			if (step === 1) {
				// step 1 means burn
				console.log("Burned happened on subnet, will mint in avax");
				console.log(
					`Transfer: from: ${from}, to: ${to}, amount: ${amount}, date: ${date}, nonce: ${nonce}, step: ${step}`
				);
				const isProccessed = await bridgeContracts.avax.processedNonces(nonce);
				if (!isProccessed) {
					console.log("is not processed already");
					txs.push({ chain: "avax", from, amount, nonce });
				}
			}
		}
	);
	console.log("Started listening for events");

	setInterval(async () => {
		if (txs.length > 0) {
			console.log("txs: ", txs);
			const { chain, from, amount, nonce } = txs.shift();
			const tx = await bridgeContracts[chain].mint(from, amount, nonce);
			await tx.wait();
		}
	}, 5000);
};

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
