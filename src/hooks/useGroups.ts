import { useReadContract, useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import GroupFactoryABI from '../contracts/abis/GroupFactory.json';
import StandardGroupABI from '../contracts/abis/StandardGroup.json';
import AuctionGroupABI from '../contracts/abis/AuctionGroup.json';
import type { Group } from '../types';
import { formatUnits } from 'viem';

export function useGroups() {
    // 1. Get list of group addresses
    const { data: groupAddresses } = useReadContract({
        address: CONTRACT_ADDRESSES.GroupFactory as `0x${string}`,
        abi: GroupFactoryABI,
        functionName: 'getGroups',
    });

    const addresses = (groupAddresses as unknown as `0x${string}`[]) || [];

    // 2. Multicall to get details for each group
    const { data: results } = useReadContracts({
        contracts: addresses.flatMap(addr => [
            { address: addr, abi: StandardGroupABI as any, functionName: 'name' },
            { address: addr, abi: StandardGroupABI as any, functionName: 'contribution' },
            { address: addr, abi: StandardGroupABI as any, functionName: 'memberCount' },
            { address: addr, abi: StandardGroupABI as any, functionName: 'groupStatus' },
            { address: addr, abi: StandardGroupABI as any, functionName: 'currentRound' },
            { address: addr, abi: StandardGroupABI as any, functionName: 'getMembers' },
            { address: addr, abi: StandardGroupABI as any, functionName: 'owner' },
            { address: addr, abi: StandardGroupABI as any, functionName: 'maxMembers' }, // +7
            { address: addr, abi: StandardGroupABI as any, functionName: 'frequency' },  // +8
            { address: addr, abi: AuctionGroupABI as any, functionName: 'highestBidder' } // +9 (Probe for Auction)
        ]),
        query: {
            enabled: addresses.length > 0,
        }
    });

    const groups: Group[] = [];

    if (results && addresses.length > 0) {
        const fieldsPerGroup = 10;

        addresses.forEach((addr, index) => {
            const offset = index * fieldsPerGroup;
            const nameRes = results[offset];
            const contribRes = results[offset + 1];
            // const countRes = results[offset + 2];
            const statusRes = results[offset + 3];
            const roundRes = results[offset + 4];
            const membersRes = results[offset + 5];
            const ownerRes = results[offset + 6];
            const maxMembersRes = results[offset + 7];
            const freqRes = results[offset + 8];
            const auctionProbeRes = results[offset + 9];

            if (nameRes.status === 'success') {
                // Map status enum: 0=RECRUITING, 1=ACTIVE, 2=LOCKED, 3=COMPLETED
                const statusVal = Number(statusRes.result);
                const statusStr = statusVal === 0 ? 'RECRUITING' : statusVal === 1 ? 'ACTIVE' : statusVal === 2 ? 'LOCKED' : 'COMPLETED';

                const membersList = (membersRes.result as string[]) || [];

                // Determine Type: If highestBidder probe succeeded, it's AUCTION.
                // Note: StandardGroup does not have highestBidder, so call should fail/revert.
                const isAuction = auctionProbeRes.status === 'success';

                // Safely extract values
                const contribution = contribRes.status === 'success' ? Number(formatUnits(BigInt(String(contribRes.result)), 6)) : 0;
                const memberLimit = maxMembersRes.status === 'success' ? Number(maxMembersRes.result) : 10;
                const currentRound = roundRes.status === 'success' ? Number(roundRes.result) : 0;
                const totalRounds = maxMembersRes.status === 'success' ? Number(maxMembersRes.result) : 10; // Fallback

                // Frequency
                let freqStr: 'WEEKLY' | 'MONTHLY' | 'BIWEEKLY' = 'WEEKLY';
                if (freqRes.status === 'success') {
                    const freqVal = Number(freqRes.result);
                    if (freqVal === 0 || freqVal === 604800) freqStr = 'WEEKLY';
                    else if (freqVal === 1 || freqVal === 2592000) freqStr = 'MONTHLY';
                    else if (freqVal === 2 || freqVal === 5184000) freqStr = 'BIWEEKLY';
                }

                groups.push({
                    id: addr,
                    name: String(nameRes.result),
                    type: isAuction ? 'AUCTION' : 'STANDARD',
                    contribution,
                    memberLimit,
                    members: membersList,
                    status: statusStr,
                    frequency: freqStr,
                    currentCycle: currentRound,
                    totalRounds,
                    startDate: new Date().toISOString(), // Contract doesn't store start date publicly?
                    createdBy: String(ownerRes?.result || '0x0000000000000000000000000000000000000000')
                });
            }
        });
    }

    return groups;
}
