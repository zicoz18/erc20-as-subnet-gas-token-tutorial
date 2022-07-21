# How to use a ERC-20 C-chain token as the gas fee token

## Introduction

Purpose of this tutorial is to use a ERC-20 C-chain token as the gas fee token on a subnet by deploying a bridge. We will not be using a bridge provider, instead we will be implementing our own bridge to truly understand how bridges work and how to modify them to our needs. Bridge we will be implementing is a [trusted](#trusted-and-trustless-bridges) bridge and it uses [lock-mint](#lock-mint-and-burn-release-mechanisms) mechanism to transfer assets from C-chain to subnet and [burn-release](#lock-mint-and-burn-release-mechanisms) mechanism from subnet to C-chain.

DISCLAIMER: The bridge implementation in this tutorial is a proof of concept and is not production ready.

## Prerequisites

- Basic knowledge of [Precompiles](https://docs.avax.network/subnets/customize-a-subnet#precompiles).
  - We will be using [NativeMinter](https://docs.avax.network/subnets/customize-a-subnet#minting-native-coins) precompile on our subnet. Familiarity with precompiles and knowledge of NativeMinter precompile will be assumed.
- Having an up and running subnet which uses NativeMinter precompile.
  - In this tutorial we will be using a local subnet. Refer to [this](https://docs.avax.network/subnets/create-a-local-subnet), to deploy your local subnet.
- Basic knowledge of [Hardhat](https://hardhat.org/).
  - We will be writing our code in a Hardhat development environment. We will write custom scripts to automate our job and add those scripts as tasks to hardhat.
- General knowledge of [Ethers js](https://docs.ethers.io/v5/).
  - We will be interacting with both the Avalanche Fuji chain and our subnet using ethers js. We will be initializing providers, signers, contracts and interacting with contracts using ethers js.
- General knowledge of [Solidity](https://docs.soliditylang.org/en/v0.8.7/).
  - We will be writing our own Bridge and Token contracts using Solidity.

## General Concepts

Before writing any code, we should understand how bridges work and what type of bridges exist to better understand what we are actually doing. Reading ethereum's official documentation about [bridges](https://ethereum.org/en/bridges/) is highly recommended.

### High level overview of our bridge design

- For our bridge, the source chain represents C-chain and destination chain represents Subnet.
- A ERC-20 token on the source chain and a native gas token on our destination chain that is mintable, using NativeMinter precompile.
- Bridge contracts on both chains with custom behaviors for ERC-20 and NativeMinter precompile.
- An off-chain relayer which is an application that listens to events on both chains. On these events, it sends transactions to other chain's bridge contract. For more detail refer to [Relayer](#relayer) part.

### Trusted and Trustless Bridges

In short, bridges allow cross-chain transfers and there are 2 main types of bridges; Trusted and Trustless. Trusted bridges depend on an entity and have trust assumptions. Trustless bridges do not require trust assumptions to external entities but only to blockchain itself. To get more details refer to ethereum's official documentation about [bridges](https://ethereum.org/en/bridges/).

### Lock-Mint and Burn-Release Mechanisms

Reason we have chosen these mechanisms is because our ERC-20 token might not be mintable and we are sure that our subnet's gas token is mintable.

#### How Lock-Mint works:

- User deposits tokens to the bridge contract, effectively locking it.
- Relayer detects the transfer event and sends a transaction to the bridge contract that is on the other chain.
- Bridge contract on the other chain mints the token and sends it to the given address.

We are using the Lock-Mint mechanism when we bridge our token from C-chain to Subnet.

#### How Burn-Release works:

- User deposits tokens to the bridge contract, and the bridge contract sends them to the 0 address, effectively burning it.
- Relayer detects the transfer event and sends a transaction to the bridge contract that is on the other chain.
- Bridge contract on the other chain sends the token to the given address, effectively releasing it.

We are using the Burn-Release mechanism when we bridge our token from Subnet to C-chain.

::: warning

If bridge contract does not have enough tokens, it can not release them. Therefore, make sure that bridge is sufficiently funded to release intended amount. This was not a concern for lock-mint mechanism because it could always mint.

:::

### Building Blocks of our Bridge

#### Relayer

Relayer is an off-chain application that listens for events on both chains. Upon events it sends transactions to other chain's bridge contracts. It has the private key of the bridge contracts' admin account allowing it to mint or release tokens.

#### Contracts

We will have bridge contracts on both chains. Users will send transactions to these contracts when they want to burn or lock their token on the respective chain. When a burn or lock happens these contracts emit an event for the relayer to observe. When the relayer observes the event on one chain, it will call bridge contract on the other chain with either mint or release function.

## Requirements

- [NodeJS](https://nodejs.org/en/) must be installed.
- [npm](https://www.npmjs.com/) must be installed.
- [Hardhat](https://www.npmjs.com/) must be installed.

## Getting Started

## Initialize the Project

Let's start by initializing our workspace with [Hardhat](https://hardhat.org/).

To initialize project, run:

```bash
npx hardhat init
```

Select `Create a JavaScript project` and walk through creating the project.

## Create Contracts

Delete `Lock.sol` file

To use openzeppelin contracts in our contracts, run:

```bash
npm i @openzeppelin/contracts
```

### Create Token Contracts

Create a `Token` folder inside `contracts` folder

#### Avax Token

Create `AvaxToken.sol` file inside `Token` folder

[AvaxToken.sol](./codeSnippets/contracts/Token/AvaxToken.md)

#### Native Minter Interface

Create `INativeMinter.sol` file inside `Token` folder

[INativeMinter.sol](./codeSnippets/contracts/Token/INativeMinter.md)

### Create Bridge Contracts

Create a `Bridge` folder inside `contracts` folder

#### Avax Bridge

Create `AvaxBridge.sol` file inside `Bridge` folder

[AvaxBridge.sol](./codeSnippets/contracts/Bridge/AvaxBridge.md)

#### Subnet Bridge

Create `SubnetBridge.sol` file inside `Bridge` folder

[SubnetBridge.sol](./codeSnippets/contracts/Bridge/SubnetBridge.md)

### Compile Contracts

To make sure there are no problems with contracts, run:

```bash
npx hardhat compile
```

## Interact with Contracts

### Constants

First we will create a `constants` folder at the root of the project to store some general values.

Inside `constants` folder create; `chains.js` and `nativeMinterAddress.js`.

[chains.js](./codeSnippets/constants/chains.md)

[nativeMinterAddress.js](./codeSnippets/constants/nativeMinterAddress.md)

### Variables

Secondly we will create a `variables` folder at the root of the project to store some updated values such as contract addresses.

Inside the `variables` folder create `contractAddresses.js` but do not put anything in it. This file will be auto generated whenever we deploy some contracts.

### Utils

Then we will create a `utils` folder at the root of the project to define some general use functions.

Inside `utils` folder create; `initProviders.js`, `initSigners.js` and `initContracts.js`

[initProviders.js](./codeSnippets/utils/initProviders.md)

[initSigners.js](./codeSnippets/utils/initSigners.md)

::: info

As you see, we have used `process.env.<..._PRIVATE_KEY>`. Reason behind that is we do not want to expose our private keys inside our code. To use this, first you have to run `npm i dotenv` to install the related package. At the root of the project create a file named `.env`. Afterwards put in the private keys of your accounts as follows,

```text
BRIDGE_ADMIN_PRIVATE_KEY=<private-key-for-admin>
BRIDGE_USER_PRIVATE_KEY=<private-key-for-user>
```

- Make sure that both accounts are funded on both chains so that they can send transactions.
- Make sure that `.env` file is included in your `.gitignore` file so that you do not upload this file to git.

:::

[initContracts.js](./codeSnippets/utils/initContracts.md)

### Scripts

We could directly create the off-chain relayer but it would be too hard to test it. Therefore, we are creating these helper scripts to quickly interact with contracts and test if relayer works as expected.

We are using [Hardhat Tasks](https://hardhat.org/guides/create-task) to run our scripts in this tutorial. We will be writing the script, updating the `hardhat.config.js` to add our new script as a hardhat task.

#### Deploy script

##### Write deploy script

Create `deploy.js` file inside `scripts` folder

[deploy.js](./codeSnippets/scripts/deploy.md)

::: warning

Make sure that BRIDGE_ADMIN has an admin role for NativeMinter. So that it can allow subnetBridge contract to mint native token

:::

##### Update hardhat.config.js file

To add `deploy` script as a hardhat task add following code inside `hardhat.config.js`

```javascript
/* Import task from hardhat config */
const { task } = require("hardhat/config");
...
/* Import deploy function */
require("./scripts/deploy");
...
/* Create deploy task */
task(
	"deploy",
	"Deploy bridges on both networks and deploy AvaxToken, also update the admins"
).setAction(async (taskArgs, hre) => {
	await deploy().catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
});
...
```

Example [hardhat.config.js](./codeSnippets/hardhatConfig0.md) file after adding the deploy task.

##### Run deploy script

To run our deploy script, run:

```bash
npx hardhat deploy
```

After running the script you should see deployed contract addresses on the command line and see that `variables/contractAddresses.js` file is updated.

#### Balance script

##### Write balance script

Create `balance.js` file inside `scripts` folder

[balance.js](./codeSnippets/scripts/balance.md)

##### Update hardhat.config.js file

To add `balance` script as a hardhat task add the following code inside `hardhat.config.js`

```javascript
/* Import task from hardhat config if you did not already */
const { task } = require("hardhat/config");
...
/* Import balance function */
require("./scripts/balance");
...
/* Create balance task  */
task("balance", "Get token balance from a network")
	/* Add `from` parameter indication the used network which is either avax or subnet */
	.addParam("from", "Network to get balance from")
	.setAction(async (taskArgs, hre) => {
		await balance(taskArgs.from).catch((error) => {
			console.error(error);
			process.exitCode = 1;
		});
	});
...
```

Example [hardhat.config.js](./codeSnippets/hardhatConfig1.md) file after adding the balance task.

##### Run balance script

To run our balance script, run:

```bash
npx hardhat balance --from avax
```

or

```bash
npx hardhat balance --from subnet
```

After running the script you should see balances printed out in the comman line. If you have used `--from subnet` you will only see the native token balance of the user. If you have used `--from avax` you will see the ERC20 balances of both user and the bridge contract.

Balance value seen on the subnet depends on how you have funded your address. But balance values on avax should look like the following:

```text
MERC20 balance of the user:  1000000.0
MERC20 balance of the bridge:  0.0
```

#### BurnOrLock script

##### Write burnOrLock script

Create `burnOrLock.js` file inside `scripts` folder

[burnOrLock.js](./codeSnippets/scripts/burnOrLock.md)

##### Update hardhat.config.js file

To add `burnOrLock` script as a hardhat task add the following code inside `hardhat.config.js`

```javascript
/* Import task from hardhat config */
const { task } = require("hardhat/config");
...
/* Import burnOrLock function */
require("./scripts/burnOrLock");
...
/* Create burnOrRelease task  */
task("burnOrLock", "Burn or lock token from a network")
	/* Add `from` parameter indication the used network which is either avax or subnet */
	.addParam("from", "Network to burn or lock from")
	/* Add `amount` parameter indication the amount to burn or lock */
	.addParam("amount", "Amount to burn or lock")
	.setAction(async (taskArgs, hre) => {
		await burnOrLock(taskArgs.from, taskArgs.amount).catch((error) => {
			console.error(error);
			process.exitCode = 1;
		});
	});
...
```

Example [hardhat.config.js](./codeSnippets/hardhatConfig2.md) file after adding all tasks.

##### Run burnOrRelease script

To run burnOrRelease script, run:

```bash
npx hardhat burnOrLock --from avax --amount <amount-of-token-to-burn-or-lock-in-ether>
```

or

```bash
npx hardhat burnOrLock --from subnet --amount <Example value: 4>
```

::: caution

When you try to run the first script `... --from avax --amount 10` if the user has 10 ERC20 tokens it will work fine and you will see the updated balances as expected on avax network. User’s decremented by 10, bridge’s incremented by 10. But you would not see that the user's native token balance on the subnet is increased. Although there are bridge contracts, there is no relayer application to establish the communication in between them. Therefore, the user locked its tokens but its balance on the subnet did not change. It is the same for the second script where the user burns tokens on subnet but does not get any new tokens on avax c-chain. Be aware, if the user account does not have native token balance on the subnet, the second script would throw an error.

::: caution

## Create the Relayer Application

Create a `relayer.js` file at root folder of the project.

[relayer.js](./codeSnippets/relayer.md)

### Running the Relayer

As you can also see from the comments of the relayer file. There are different ways to start the relayer application

- ```bash
  node ./relayer.js
  ```

  - When run with `node ./relayer.js`:
    Relayer will subscribe to events from recent blocks on Avax and Subnet
    Therefore, it might not processes an event that is emitted 1000 blocks ago
    If you want to start the relayer and make a transaction, current way of running is what you are looking for

- ```bash
  node ./relayer.js <avaxBlockNumber> <subnetBlockNumber>
  ```

  - When run with `node ./relayer.js <avaxBlockNumber> <subnetBlockNumber>`
    Relayer will look for events on Avax and Subnet from the block number you provided
    and will iterate through the next 10 blocks for the event. Will processes observed event
    Therefore, if you have a burn or lock event emitted 1000 blocks ago, you can process it by giving the right blockNumber.
    If you want to start the relayer to processes an old burn or lock event, current way of running is what you are looking for

- ```bash
  node ./relayer.js <avaxBlockNumber>
  ```

- ```bash
  node ./relayer.js -1 <subnetBlockNumber>
  ```

  - When run with `node ./relayer.js <avaxBlockNumber>` or `node ./relayer.js -1 <subnetBlockNumber>`
    Relayer will look for events on either Avax or Subnet from the block number you provided
    and will iterate through the next 10 blocks for the event. Will processes observed event
    "-1" as block number means do not process any old blocks for that chain.
    Therefore, `node ./relayer.js -1 <subnetBlockNumber>` will only process events for the subnet.
    If you want to start the relayer to process an old burn or lock event just on one chain, current way of running is what you are looking for

### Testing the relayer

<!-- TODO: Might replace videos -->

#### Test relayer

In this video on the left terminal I am using our custom scripts to interact with chains and on the right terminal I am using our relay to create the cross chain communication.

![Test relayer with scripts](./assets/2.gif)

##### What happens on the video?

- Check balances on both chains
- Start the relayer
- An already processed event appears on the console of the relayer therefore it does not get processed
- Check the balances to make sure already processed event is not processed
- Lock 20 ERC20s token from avax and see the updated balances of user and the bridge on avax
- Relayer observes the transaction and sends a transaction to mint native tokens on subnet
- Check the balances on both subnet and avax. As expected our subnet native token balance increases by 20
- Burn 5 native tokens from subnet and see the updated balance of the user
- Relayer observers the transaction and sends a transaction to release ERC20 tokens on avax
- Check balance on both subnet and avax. As expected our ERC20 balance increases by 5 and bridge's decreases by 5

#### Test relayer for old events

![Test relayer for old events](./assets/1.gif)

##### What happens on the video?

- Start by a lock transaction from avax with amount 40. As stated in the video this transaction was sent when the relayer was not working. Therefore, it is not processed and it will not be processed when we start the relayer with `node relayer.js` because there has been many blocks after it
- Check balances on both chains
- Start the relayer with `node relayer.js` to show that the event is not getting processed. Printed events are events that happened on the subnet. Since there is no blocks building on my local subnet other than my own, my old burns are considered old and therefore shown
- Start the relayer with `node relayer.js <blockNumber>` to show that event will be processed and will be printed as "OLD: "
- Check balances on both chains to confirm that old lock event on avax has been processed by relayer and tokens have been minted on avax

### Troubleshoot Common Issues

Things to check out;

- Error while compiling contracts
  - You have run `npm i @openzeppelin/contracts`.
- Error while running scripts
  - Both accounts on both chains have some native token so that they can send transactions.
  - Folder structures and file names are as suggested. In our scripts we access the contract abis and bytecodes directly from the files that are created by hardhat. Those files are created according to your file structure and if you changed the structure, imports might fail.
  - You have your private keys inside the .env file and you have downloaded dotenv package by running `npm i dotenv`.
  - Your subnet has NativeMinter precompile with bridgeAdmin account as the admin.
  - You have created a contractAddresses.js file inside the variables folder. If you did not create this file, deploy.js would fail.

## Conclusion

Congratulations! You have created a bridge between avax C-chain and your subnet to use an ERC-20 token as a gas token.

Things achieved:

- Understood general design of bridges.
- Implemented bridge contracts.
- Used NativeMinter precompile.
- Created a relayer application to communicate with both chains.
- Tested relayer to make sure communication between chains are established.
- Used ERC-20 token as the gas token on the subnet.
