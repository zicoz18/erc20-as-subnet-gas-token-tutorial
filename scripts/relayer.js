const { ethers } = require("ethers");
const dotenv = require("dotenv");

const initProviders = require("../utils/initProviders");
const initSigners = require("../utils/initSigners");
const initContracts = require("../utils/initContracts");

dotenv.config();

const main = async () => {
	let txs = [];

	const providers = initProviders();
	const signers = initSigners(providers);

	// For Avax
	if (process.argv[2]) {
		const startBlock = parseInt(process.argv[2]);
		const recentBlock = await providers.avax.getBlockNumber();
		// If startBlock + 10 exceeds the recent block it would throw an error. Because we will try to process blocks that are not there.
		// Therefore, we set endBlock to the smaller one of two
		const endBlock =
			startBlock + 10 >= recentBlock ? recentBlock : startBlock + 10;
		providers.avax.resetEventsBlock(startBlock);
		const localBridgeContracts = initContracts(signers);
		const filter = localBridgeContracts.avax.bridge.filters.Transfer();
		let oldAvaxEvents = await localBridgeContracts.avax.bridge.queryFilter(
			filter,
			startBlock,
			endBlock
		);
		oldAvaxEvents = oldAvaxEvents.map((event) => ({
			chain: "subnet",
			to: event.args.to,
			amount: event.args.amount,
			nonce: event.args.nonce,
		}));

		await Promise.all(
			oldAvaxEvents.map(async (event) => {
				const { to, amount, nonce } = event;
				console.log("OLD: Lock happened on avax");
				console.log(
					`OLD: Transfer: to: ${to},  amount: ${ethers.utils.formatEther(
						amount
					)}, nonce: ${nonce}`
				);
				const isProccessed =
					await localBridgeContracts.subnet.bridge.processedNonces(nonce);
				if (!isProccessed) {
					console.log("OLD: is not processed, will mint on subnet\n");
					txs.push(event);
				} else {
					console.log("OLD: is already processed\n");
				}
			})
		);
	}

	// For Subnet
	if (process.argv[3]) {
		const startBlock = parseInt(process.argv[3]);
		const endBlock = startBlock + 10;
		providers.avax.resetEventsBlock(startBlock);
		const localBridgeContracts = initContracts(signers);
		const filter = localBridgeContracts.subnet.bridge.filters.Transfer();
		let oldSubnetEvents = await localBridgeContracts.subnet.bridge.queryFilter(
			filter,
			startBlock,
			endBlock
		);
		oldSubnetEvents = oldSubnetEvents.map((event) => ({
			chain: "avax",
			to: event.args.to,
			amount: event.args.amount,
			nonce: event.args.nonce,
		}));

		await Promise.all(
			oldSubnetEvents.map(async (event) => {
				const { to, amount, nonce } = event;
				console.log("OLD: Burned happened on subnet");
				console.log(
					`OLD: Transfer: to: ${to},  amount: ${ethers.utils.formatEther(
						amount
					)}, nonce: ${nonce}`
				);
				const isProccessed =
					await localBridgeContracts.subnet.bridge.processedNonces(nonce);
				if (!isProccessed) {
					console.log("OLD: is not processed, will release on subnet\n");
					txs.push(event);
				} else {
					console.log("OLD: is already processed\n");
				}
			})
		);
	}

	console.log("\n\nOld events proccessed");

	const bridgeContracts = initContracts(signers);

	bridgeContracts.avax.bridge.on(
		"Transfer",
		async (from, to, amount, date, nonce, step) => {
			if (step === 1) {
				// step 1 means burn
				console.log("Lock happened on avax");
				console.log(
					`Transfer: from: ${from}, to: ${to}, amount: ${ethers.utils.formatEther(
						amount
					)}, date: ${date}, nonce: ${nonce}, step: ${step}`
				);
				const isProccessed =
					await bridgeContracts.subnet.bridge.processedNonces(nonce);
				if (!isProccessed) {
					console.log("is not processed, will mint on subnet\n");
					txs.push({ chain: "subnet", to, amount, nonce });
				} else {
					console.log("is already processed\n");
				}
			}
		}
	);

	bridgeContracts.subnet.bridge.on(
		"Transfer",
		async (from, to, amount, date, nonce, step) => {
			if (step === 1) {
				// step 1 means burn
				console.log("Burn happened on subnet");
				console.log(
					`Transfer: from: ${from}, to: ${to}, amount: ${ethers.utils.formatEther(
						amount
					)}, date: ${date}, nonce: ${nonce}, step: ${step}`
				);
				const isProccessed = await bridgeContracts.avax.bridge.processedNonces(
					nonce
				);
				if (!isProccessed) {
					console.log("is not processed, will release on avax\n");
					txs.push({ chain: "avax", to, amount, nonce });
				} else {
					console.log("is already processed\n");
				}
			}
		}
	);
	console.log("Started listening for new events\n\n");

	setInterval(async () => {
		if (txs.length > 0) {
			// Remove duplicate tx objects
			txs = txs.filter(
				(value, index, self) =>
					index ===
					self.findIndex(
						(t) => t.place === value.place && t.name === value.name
					)
			);
			console.log("txs: ", txs);
			let tx;
			const { chain, to, amount, nonce } = txs.shift();
			if (chain === "avax") {
				tx = await bridgeContracts[chain].bridge.release(to, amount, nonce);
			} else if (chain === "subnet") {
				tx = await bridgeContracts[chain].bridge.mint(to, amount, nonce);
			} else return;
			await tx.wait();
			console.log("transaction processed, token minted or released");
		}
	}, 5000);
};

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
