// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StandardGroup.sol";
import "./AuctionGroup.sol";

contract GroupFactory {
    // Enum to match frontend types
    enum GroupType { STANDARD, AUCTION }

    event GroupCreated(address indexed groupAddress, string name, uint256 groupType);

    address[] public deployedGroups;

    function createGroup(
        string memory _name,
        string memory _symbol,
        address _currency,
        uint256 _contribution,
        uint256 _maxMembers,
        uint256 _frequency, // Seconds per round
        GroupType _type
    ) external returns (address) {
        address newGroup;
        
        if (_type == GroupType.STANDARD) {
            newGroup = address(new StandardGroup(
                _name, 
                _symbol, 
                _currency, 
                _contribution, 
                _maxMembers, 
                _frequency,
                msg.sender
            ));
        } else {
            newGroup = address(new AuctionGroup(
                _name, 
                _symbol, 
                _currency, 
                _contribution, 
                _maxMembers, 
                _frequency,
                msg.sender
            ));
        }

        deployedGroups.push(newGroup);
        emit GroupCreated(newGroup, _name, uint256(_type));
        return newGroup;
    }

    function getGroups() external view returns (address[] memory) {
        return deployedGroups;
    }
    
    // Helper to get count
    function getGroupCount() external view returns (uint256) {
        return deployedGroups.length;
    }
}
