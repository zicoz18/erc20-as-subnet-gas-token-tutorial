// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "../Token/AvaxToken.sol";

contract AvaxBridge {
    address public admin;
    uint public nonce;

    IAvaxToken public avaxToken;

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
        avaxToken = IAvaxToken(_token);
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }

    function setTokenAdmin(address newTokenAdmin) external onlyAdmin {
        avaxToken.setAdmin(newTokenAdmin);
    }

    function mint(
        address to,
        uint amount,
        uint subnetNonce
    ) external onlyAdmin {
        require(
            processedNonces[subnetNonce] == false,
            "nonce already proccessed"
        );
        processedNonces[subnetNonce] = true;

        avaxToken.mint(to, amount);
        emit Transfer(
            msg.sender,
            to,
            amount,
            block.timestamp,
            subnetNonce,
            Step.Mint
        );
    }

    // User calls this function which burns their token.
    // Relayer listens for this event and mints the token at the subnet for the address 'to'
    function burn(address to, uint amount) external {
        avaxToken.burn(msg.sender, amount);
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
