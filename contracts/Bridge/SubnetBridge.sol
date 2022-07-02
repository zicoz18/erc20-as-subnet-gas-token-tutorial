// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "../Token/INativeMinter.sol";

contract SubnetBridge {
    address public admin;
    address public burnAddress = address(0x0);
    uint public nonce;

    NativeMinterInterface public nativeMinter =
        NativeMinterInterface(
            address(0x0200000000000000000000000000000000000001)
        );

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

    constructor() {
        admin = msg.sender;
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }

    function mint(
        address to,
        uint amount,
        uint avaxNonce
    ) external onlyAdmin {
        require(
            processedNonces[avaxNonce] == false,
            "nonce already proccessed"
        );
        processedNonces[avaxNonce] = true;

        nativeMinter.mintNativeCoin(to, amount);
        emit Transfer(
            msg.sender,
            to,
            amount,
            block.timestamp,
            avaxNonce,
            Step.Mint
        );
    }

    function burn(address to) external payable {
        require(msg.value > 0, "You have to burn more than 0 tokens");
        (bool sent, ) = payable(burnAddress).call{value: msg.value}("");
        require(sent, "Failed to send native token");
        emit Transfer(
            msg.sender,
            to,
            msg.value,
            block.timestamp,
            nonce,
            Step.Burn
        );
        nonce++;
    }
}
