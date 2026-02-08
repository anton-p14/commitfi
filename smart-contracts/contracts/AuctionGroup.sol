// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuctionGroup is Ownable {
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
    uint256 public totalRounds;
    
    mapping(address => bool) public isMember;
    mapping(address => uint256) public bids;
    address public highestBidder;
    uint256 public highestBid;

    event AuctionStarted(uint256 timestamp);
    event BidPlaced(address indexed bidder, uint256 amount);
    event RoundResolved(address indexed winner, uint256 payout, uint256 bidAmount, uint256 nextRoundStart);
    
    uint256 public roundStart;
    // For demo purposes, Auction Duration is short (e.g. 5 minutes) regardless of Cycle Frequency
    // In production this might be a % of frequency or constructor arg.
    uint256 public constant AUCTION_DURATION = 5 minutes;

    mapping(address => bool) public hasReceivedPayout;

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
    }

    function join() external {
        require(groupStatus == Status.RECRUITING, "Group not recruiting");
        require(members.length < maxMembers, "Group full");
        require(!isMember[msg.sender], "Already joined");
        
        require(currency.transferFrom(msg.sender, address(this), contribution), "Transfer failed");

        members.push(msg.sender);
        isMember[msg.sender] = true;
    }

    function lock() external onlyOwner {
        require(groupStatus == Status.RECRUITING, "Cannot lock");
        require(members.length > 1, "Not enough members");
        groupStatus = Status.ACTIVE;
        totalRounds = members.length;
        // Start Cycle 1
        currentRound = 1;
        roundStart = block.timestamp;
        emit AuctionStarted(block.timestamp);
    }

    function bid(uint256 amount) external {
        require(groupStatus == Status.ACTIVE, "Not active");
        require(isMember[msg.sender], "Not a member");
        require(!hasReceivedPayout[msg.sender], "Already paid out");
        require(amount > highestBid, "Bid too low");
        
        // Proper time check
        require(block.timestamp < roundStart + AUCTION_DURATION, "Auction ended"); 

        require(currency.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        if (highestBidder != address(0)) {
            // Refund previous bidder
            require(currency.transfer(highestBidder, highestBid), "Refund failed");
        }

        highestBidder = msg.sender;
        highestBid = amount;
        emit BidPlaced(msg.sender, amount);
    }

    function resolveRound() external {
        require(groupStatus == Status.ACTIVE, "Not active");
        require(block.timestamp >= roundStart + AUCTION_DURATION, "Auction still active");
        require(highestBidder != address(0), "No bids");
        require(currentRound <= totalRounds, "Already completed");

        // Payout Logic: Pool - Bid
        uint256 pool = contribution * members.length;
        uint256 payout = pool - highestBid;

        // Effects
        hasReceivedPayout[highestBidder] = true;
        
        // Interactions
        require(currency.transfer(highestBidder, payout), "Payout failed");
        
        emit RoundResolved(highestBidder, payout, highestBid, roundStart + frequency);

        // Prep Next Round
        currentRound++;
        if (currentRound > totalRounds) {
            groupStatus = Status.COMPLETED;
        } else {
            // Reset for next cycle
            // NOTE: Next auction starts at `roundStart + frequency`
            // But we update `roundStart` to that future time.
            roundStart = roundStart + frequency;
            highestBidder = address(0);
            highestBid = 0;
            emit AuctionStarted(roundStart);
        }
    }

    function memberCount() external view returns (uint256) {
        return members.length;
    }

    function getMembers() external view returns (address[] memory) {
        return members;
    }
}
