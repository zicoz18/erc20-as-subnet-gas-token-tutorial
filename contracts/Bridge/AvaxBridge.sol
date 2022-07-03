// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AvaxBridge {
    address public admin;
    uint public nonce;

    IERC20 public avaxToken;

    mapping(uint => bool) public processedNonces;

    enum Step {
        Mint,
        Burn
    }

    event Transfer(
        address from,
        address to,
        uint amount,
        uint time,
        uint nonce,
        Step indexed step
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }

    constructor(address _token) {
        admin = msg.sender;
        avaxToken = IERC20(_token);
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }

    function release(
        address to,
        uint amount,
        uint subnetNonce
    ) external onlyAdmin {
        require(
            processedNonces[subnetNonce] == false,
            "nonce already proccessed"
        );
        processedNonces[subnetNonce] = true;

        // Bridge sends locked tokens to the `to` address therefore, relases the tokens
        avaxToken.transfer(to, amount);

        emit Transfer(
            msg.sender,
            to,
            amount,
            block.timestamp,
            subnetNonce,
            Step.Mint
        );
    }

    // User calls this function which locks their token.
    // Relayer listens for emitted event and mints the token at the subnet for the address 'to'
    function lock(address to, uint amount) external {
        // Send tokens from sender to bridge
        // Do not forget, sender should have an allowence to do this
        avaxToken.transferFrom(msg.sender, address(this), amount);

        emit Transfer(
            msg.sender,
            to,
            amount,
            block.timestamp,
            nonce,
            Step.Burn
        );
        nonce++;
    }
}
