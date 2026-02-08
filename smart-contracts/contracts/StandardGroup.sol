// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StandardGroup is Ownable {
    string public name;
    string public symbol;
    IERC20 public currency;
    uint256 public contribution;
    uint256 public maxMembers;
    uint256 public frequency;
    
    enum Status { RECRUITING, ACTIVE, LOCKED, COMPLETED }
    Status public groupStatus;
    
    address[] public members;
    uint256 public currentRound;
    uint256 public totalRounds; // usually equals members.length
    
    // Mapping to track if address is member
    mapping(address => bool) public isMember;

    constructor(
        string memory _name,
        string memory _symbol,
        address _currency,
        uint256 _contribution,
        uint256 _maxMembers,
        uint256 _frequency,
        address _creator
    ) Ownable(_creator) {
        name = _name;
        symbol = _symbol;
        currency = IERC20(_currency);
        contribution = _contribution;
        maxMembers = _maxMembers;
        frequency = _frequency;
        groupStatus = Status.RECRUITING;
        
        // Creator doesn't join automatically in this pattern, or maybe they do?
        // Let's assume they have to join explicitly to pay.
    }

    function join() external {
        require(groupStatus == Status.RECRUITING, "Group not recruiting");
        require(members.length < maxMembers, "Group full");
        require(!isMember[msg.sender], "Already joined");
        
        // Taking generic 'join implies deposit' approach for simplicity? 
        // User requirements said 'Create ... does not trigger wallet transactions' (initially).
        // But 'Join Group' requires 'USDC approval if needed' + 'join transaction'.
        // So join() does transfer funds? No, typically first deposit is when it starts?
        // Or generic 'join' puts you on list, 'lock' starts it?
        
        // Let's require the first contribution ON JOIN to commmit.
        require(currency.transferFrom(msg.sender, address(this), contribution), "Transfer failed");

        members.push(msg.sender);
        isMember[msg.sender] = true;
        
        if (members.length == maxMembers) {
            // Auto lock? Or wait for admin?
            // "Lock & Commit Step: Introducing a new button that triggers wallet transactions ONLY when the group is full"
            // So maybe join does NOT take money?
            // "Join Group Flow: Modifying the flow to only add users to members list without immediate payment"
            // Wait, this conflicts with "Ensure gas is paid in USDC... No silent failures".
            // The prompt "Feature Implementation (Real Blockchain)" checklists:
            // "Implement joinGroup() transaction with USDC approval"
            // This suggests transfer happens here.
            
            // I will implement "Transfer on Join" for security/commitment in this version.
        }
    }

    function lock() external onlyOwner {
        require(groupStatus == Status.RECRUITING, "Cannot lock");
        require(members.length > 1, "Not enough members");
        groupStatus = Status.ACTIVE;
        totalRounds = members.length;
        currentRound = 1;
    }
    
    function bid(uint256 amount) external {
        // Auction logic placeholder for Standard Group (doesn't support bidding)
        revert("Not an auction group");
    }

    function memberCount() external view returns (uint256) {
        return members.length;
    }

    function getMembers() external view returns (address[] memory) {
        return members;
    }
}
