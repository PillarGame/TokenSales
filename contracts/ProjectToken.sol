// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProjectToken is ERC20, Ownable {
    using Address for address;

    constructor(string memory _name, string memory _symbol)ERC20(_name, _symbol){}

    function mint(address _to, uint256 _amount) external onlyOwner returns(bool) {
        _mint(_to, _amount);
        return true;
    }

    function burn(uint256 _amount) external onlyOwner returns(bool) {
        _burn(msg.sender, _amount);
        return true;
    }
}