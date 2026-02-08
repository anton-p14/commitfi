import { useState, useEffect } from 'react';
import { useReadContracts, useWatchContractEvent, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import AuctionGroupABI from '../contracts/abis/AuctionGroup.json';

export type AuctionStatus = 'WAITING' | 'LIVE' | 'ENDED';

export interface AuctionData {
    highestBid: string;
    highestBidder: string;
    roundStart: number;
    frequency: number;
    timeLeft: number;
    status: AuctionStatus;
    minBid: string;
}

export function useAuction(groupId: string | null, isAuction: boolean) {
    const { address } = useAccount();
    const [now, setNow] = useState(Math.floor(Date.now() / 1000));

    // Update time every second
    useEffect(() => {
        if (!isAuction || !groupId) return;
        const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
        return () => clearInterval(interval);
    }, [isAuction, groupId]);

    // Read Data
    const { data, refetch } = useReadContracts({
        contracts: [
            { address: groupId as `0x${string}`, abi: AuctionGroupABI, functionName: 'highestBid' },
            { address: groupId as `0x${string}`, abi: AuctionGroupABI, functionName: 'highestBidder' },
            { address: groupId as `0x${string}`, abi: AuctionGroupABI, functionName: 'roundStart' },
            { address: groupId as `0x${string}`, abi: AuctionGroupABI, functionName: 'frequency' },
            { address: groupId as `0x${string}`, abi: AuctionGroupABI, functionName: 'groupStatus' },
            { address: groupId as `0x${string}`, abi: AuctionGroupABI, functionName: 'hasReceivedPayout', args: [address || '0x0000000000000000000000000000000000000000'] },
        ],
        query: {
            enabled: !!groupId && isAuction,
            refetchInterval: 5000, // Fallback polling
        }
    });

    // Event Listeners
    useWatchContractEvent({
        address: groupId as `0x${string}`,
        abi: AuctionGroupABI,
        eventName: 'BidPlaced',
        onLogs: () => refetch(),
    });

    useWatchContractEvent({
        address: groupId as `0x${string}`,
        abi: AuctionGroupABI,
        eventName: 'AuctionStarted',
        onLogs: () => refetch(),
    });

    useWatchContractEvent({
        address: groupId as `0x${string}`,
        abi: AuctionGroupABI,
        eventName: 'RoundResolved',
        onLogs: () => refetch(),
    });

    // Parse Data
    const highestBidRaw = data?.[0]?.result as bigint | undefined;
    const highestBidder = data?.[1]?.result as string | undefined;
    const roundStart = Number(data?.[2]?.result || 0);
    const frequency = Number(data?.[3]?.result || 0);
    const groupStatus = Number(data?.[4]?.result || 0); // 0=RECRUITING (WAITING), 1=ACTIVE (LIVE), etc.
    const hasReceivedPayout = Boolean(data?.[5]?.result);

    const highestBid = highestBidRaw ? formatUnits(highestBidRaw, 6) : '0';

    // Derive Status
    // Enum: RECRUITING=0, ACTIVE=1, LOCKED=2, COMPLETED=3.
    // However, existing contract might have different enum values?
    // AuctionGroup.sol: Enum Status { RECRUITING, ACTIVE, LOCKED, COMPLETED }
    // Lock() sets status to ACTIVE.

    let status: AuctionStatus = 'WAITING';
    if (groupStatus === 1) status = 'LIVE'; // ACTIVE
    if (groupStatus === 2 || groupStatus === 3) status = 'ENDED';

    // Time Check
    // AUCTION_DURATION is hardcoded to 5 minutes in contract for demo
    // We should ideally read it, but for now we assume 5 minutes if LIVE
    const AUCTION_DURATION = 300;
    const endTime = roundStart + AUCTION_DURATION;

    if (status === 'LIVE' && now >= endTime) {
        status = 'ENDED';
    }

    const timeLeft = Math.max(0, endTime - now);

    return {
        highestBid,
        highestBidder: highestBidder === '0x0000000000000000000000000000000000000000' ? null : highestBidder,
        roundStart,
        frequency,
        timeLeft,
        status,
        hasReceivedPayout,
        refetch
    };
}
