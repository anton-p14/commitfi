// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuctionGroup is Ownable {
    string public name;
    string public symbol;
    IERC20 public currency;
    uint256 public contribution;
    uint256 public collateral; // New: 10% of contribution
    uint256 public maxMembers;
    uint256 public frequency;
    
    enum Status { RECRUITING, ACTIVE, LOCKED, COMPLETED }
    Status public groupStatus;
    
    enum MemberStatus { ACTIVE, DEFAULTED }
    struct MemberInfo {
        MemberStatus status;
        bool exists;
    }
    mapping(address => MemberInfo) public memberInfo;

    address[] public members;
    uint256 public currentRound;
    uint256 public totalRounds;
    
    mapping(address => bool) public isMember;
    mapping(address => uint256) public bids;
    address public highestBidder;
    uint256 public highestBid;

    // Track contributions per round: roundId => member => paid?
    mapping(uint256 => mapping(address => bool)) public hasContributed;

    event AuctionStarted(uint256 timestamp);
    event BidPlaced(address indexed bidder, uint256 amount);
    event RoundResolved(address indexed winner, uint256 payout, uint256 bidAmount, uint256 nextRoundStart);
    event ContributionPaid(address indexed member, uint256 round);
    event MemberDefaulted(address indexed member, uint256 round);
    
    uint256 public roundStart;
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
        collateral = _contribution / 10; // 10% Collateral
        maxMembers = _maxMembers;
        frequency = _frequency;
        groupStatus = Status.RECRUITING;
    }

    function join() external {
        require(groupStatus == Status.RECRUITING, "Group not recruiting");
        require(members.length < maxMembers, "Group full");
        require(!memberInfo[msg.sender].exists, "Already joined");
        
        // Transfer Contribution + Collateral
        uint256 totalRequired = contribution + collateral;
        require(currency.transferFrom(msg.sender, address(this), totalRequired), "Transfer failed");

        members.push(msg.sender);
        isMember[msg.sender] = true;
        memberInfo[msg.sender] = MemberInfo({
            status: MemberStatus.ACTIVE,
            exists: true
        });

        // Mark Round 1 as paid (initial contribution covers it)
        hasContributed[1][msg.sender] = true;
    }

    // New: Recurring Contribution
    function payContribution() external {
        require(groupStatus == Status.ACTIVE, "Group not active");
        require(memberInfo[msg.sender].status == MemberStatus.ACTIVE, "Not active member");
        require(!hasContributed[currentRound][msg.sender], "Already paid for this round");
        
        require(currency.transferFrom(msg.sender, address(this), contribution), "Transfer failed");
        
        hasContributed[currentRound][msg.sender] = true;
        emit ContributionPaid(msg.sender, currentRound);
    }

    function lock() external onlyOwner {
        require(groupStatus == Status.RECRUITING, "Cannot lock");
        require(members.length > 1, "Not enough members");
        groupStatus = Status.ACTIVE;
        totalRounds = members.length;
        currentRound = 1;
        roundStart = block.timestamp;
        emit AuctionStarted(block.timestamp);
    }

    function bid(uint256 amount) external {
        require(groupStatus == Status.ACTIVE, "Not active");
        require(memberInfo[msg.sender].status == MemberStatus.ACTIVE, "Not active member");
        require(!hasReceivedPayout[msg.sender], "Already paid out");
        require(amount > highestBid, "Bid too low");
        require(block.timestamp < roundStart + AUCTION_DURATION, "Auction ended"); 

        require(currency.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        if (highestBidder != address(0)) {
            require(currency.transfer(highestBidder, highestBid), "Refund failed");
        }

        highestBidder = msg.sender;
        highestBid = amount;
        emit BidPlaced(msg.sender, amount);
    }

    function resolveRound() external {
        require(groupStatus == Status.ACTIVE, "Not active");
        require(block.timestamp >= roundStart + AUCTION_DURATION, "Auction still active");
        // require(highestBidder != address(0), "No bids"); // Allow resolving even if no bids (pot carries over? or random? For now assume bids)
        require(currentRound <= totalRounds, "Already completed");

        // 1. Slash Defaulters & Calculate Pool
        uint256 activeContributors = 0;
        uint256 slashedCollateral = 0;

        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (memberInfo[member].status == MemberStatus.ACTIVE) {
                if (!hasContributed[currentRound][member]) {
                    // Default Logic
                    memberInfo[member].status = MemberStatus.DEFAULTED;
                    slashedCollateral += collateral; 
                    emit MemberDefaulted(member, currentRound);
                } else {
                    activeContributors++;
                }
            }
        }

        // 2. Calculate Payout
        // Pool = (Active * Contribution) + Slashed Collateral (from this round)
        // NOTE: Previous defaulted members don't pay.
        // NOTE: Winner gets the pool collected.
        
        uint256 currentPool = (activeContributors * contribution) + slashedCollateral;
        
        // If no bids, maybe we just carry over? Or pay random?
        // For CommitFi demo, let's require a bid to keep it simple, or refund pool (too complex).
        // Let's assume there's always a bidder for now, or revert.
        require(highestBidder != address(0), "No bids");

        uint256 payout = currentPool - highestBid;

        // Effects
        hasReceivedPayout[highestBidder] = true;
        
        // Interactions
        require(currency.transfer(highestBidder, payout), "Payout failed");
        emit RoundResolved(highestBidder, payout, highestBid, roundStart + frequency);

        // Prep Next Round
        currentRound++;
        if (currentRound > totalRounds) {
            groupStatus = Status.COMPLETED;
            // Return Collateral to non-defaulted members?
            // "The slashed pre-commitment... distributed... OR added to next cycle"
            // We added slashed to current pool.
            // Remaining Active members should get their collateral back?
            // Simplification: Collateral stays in contract or refunded at very end. 
            // Let's refund collateral to remaining active members now.
            for (uint i = 0; i < members.length; i++) {
                if (memberInfo[members[i]].status == MemberStatus.ACTIVE) {
                     currency.transfer(members[i], collateral);
                }
            }
        } else {
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
