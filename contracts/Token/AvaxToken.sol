// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IAvaxToken {
    function mint(address to, uint256 amount) external;

    function burn(address owner, uint256 amount) external;

    function setAdmin(address newAdmin) external;
}

contract AvaxToken is ERC20, IAvaxToken {
    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        admin = msg.sender;
    }

    function setAdmin(address newAdmin) external override onlyAdmin {
        admin = newAdmin;
    }

    function mint(address to, uint256 amount) external override onlyAdmin {
        _mint(to, amount);
    }

    function burn(address owner, uint256 amount) external override onlyAdmin {
        _burn(owner, amount);
    }
}
