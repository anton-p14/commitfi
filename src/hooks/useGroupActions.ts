import { useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import GroupFactoryABI from '../contracts/abis/GroupFactory.json';
import StandardGroupABI from '../contracts/abis/StandardGroup.json';
import AuctionGroupABI from '../contracts/abis/AuctionGroup.json';
import USDCABI from '../contracts/abis/USDC.json';
import type { GroupType, CycleFrequency } from '../types';
import { config } from '../config/wagmi'; // Ensure config is imported for read actions if needed
import { readContract, waitForTransactionReceipt } from 'wagmi/actions';

export function useGroupActions() {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();

    // State to track multi-step process
    const [status, setStatus] = useState<'idle' | 'checking_allowance' | 'approving' | 'confirming_approval' | 'creating' | 'confirming_creation' | 'joining' | 'success' | 'error'>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Helper for delay
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const createGroup = async (params: {
        name: string;
        type: GroupType;
        contribution: number;
        memberLimit: number;
        frequency: CycleFrequency;
        startDate: string | null;
        createdBy: string;
    }) => {
        try {
            // 1. Validate Input
            if (!params.name) throw new Error("Group name is required");
            if (params.contribution <= 0) throw new Error("Contribution must be > 0");
            if (params.memberLimit <= 1) throw new Error("Member limit must be > 1");
            if (!address) throw new Error("Wallet not connected");

            setStatus('checking_allowance');
            setError(null);

            const contributionAmount = parseUnits(params.contribution.toString(), 6); // USDC has 6 decimals

            // 2. Check Allowance
            const allowance = await readContract(config, {
                address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                abi: USDCABI,
                functionName: 'allowance',
                args: [address, CONTRACT_ADDRESSES.GroupFactory],
            }) as bigint;

            console.log(`Allowance: ${allowance}, Required: ${contributionAmount}`);

            // 3. Approve if needed
            if (allowance < contributionAmount) {
                console.log("Requesting Approval...");
                setStatus('approving');
                const approvalHash = await writeContractAsync({
                    address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                    abi: USDCABI,
                    functionName: 'approve',
                    args: [CONTRACT_ADDRESSES.GroupFactory, contributionAmount],
                });

                console.log(`Approval Tx: ${approvalHash}`);
                setStatus('confirming_approval');
                await waitForTransactionReceipt(config, { hash: approvalHash });
                console.log("Approval Confirmed");
            }

            // 4. Create Group (ALWAYS execute this after approval logic)
            console.log("Creating Group...");
            setStatus('creating');

            // Map types to contract enums/values
            const groupTypeInt = params.type === 'STANDARD' ? 0 : 1;

            // Fix: Map frequency to Enum (0, 1, 2) instead of Seconds
            const freqEnum =
                params.frequency === 'WEEKLY' ? 0 :
                    params.frequency === 'MONTHLY' ? 1 :
                        2; // Default to 2 (Bi-weekly or other)

            console.log("CREATE_GROUP_ENUMS", {
                groupTypeInt,
                freqEnum,
                memberLimit: params.memberLimit
            });

            const createHash = await writeContractAsync({
                address: CONTRACT_ADDRESSES.GroupFactory as `0x${string}`,
                abi: GroupFactoryABI,
                functionName: 'createGroup',
                args: [
                    params.name,
                    "GRP", // Symbol
                    CONTRACT_ADDRESSES.USDC,
                    contributionAmount,
                    BigInt(params.memberLimit),
                    BigInt(freqEnum),
                    groupTypeInt
                ],
            });

            console.log(`Create Group Tx: ${createHash}`);
            setTxHash(createHash);
            setStatus('confirming_creation');

            const receipt = await waitForTransactionReceipt(config, { hash: createHash });

            if (receipt.status !== 'success') {
                throw new Error("Transaction failed on chain");
            }

            console.log("Group Created Successfully!");
            setStatus('success');
            return true;

        } catch (err: any) {
            console.error("Create Group Error:", err);
            setStatus('error');
            const msg = err.shortMessage || err.message || "Failed to create group";
            setError(msg);
            throw err; // Ensure error propagates to UI/Console
        } finally {
            if (status === 'success') {
                // Keep success state briefly? Or let UI navigate away.
                // We won't auto-reset to idle immediately to allow UI to see success.
            }
        }
    };

    const joinGroup = async (groupId: string, groupType: GroupType) => {
        try {
            setStatus('checking_allowance');
            setError(null);
            if (!address) throw new Error("Wallet not connected");

            // 1. Select ABI based on Group Type (Strict Separation)
            const groupABI = groupType === 'AUCTION' ? AuctionGroupABI : StandardGroupABI;

            // 2. Fetch contribution amount from the specific Group Contract
            const contribution = await readContract(config, {
                address: groupId as `0x${string}`,
                abi: groupABI,
                functionName: 'contribution',
                args: []
            }) as bigint;

            // 2. Fetch contribution amount & state from the specific Group Contract
            const groupState = await readContract(config, {
                address: groupId as `0x${string}`,
                abi: groupABI,
                functionName: 'groupStatus', // Check status
                args: []
            }) as number;

            const members = await readContract(config, {
                address: groupId as `0x${string}`,
                abi: groupABI,
                functionName: 'getMembers',
                args: []
            }) as string[];

            // 3. Check Allowance & Balance
            const balance = await readContract(config, {
                address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                abi: USDCABI,
                functionName: 'balanceOf',
                args: [address],
            }) as bigint;

            let allowance = await readContract(config, {
                address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                abi: USDCABI,
                functionName: 'allowance',
                args: [address, groupId],
            }) as bigint;

            console.log("JOIN_DEBUG", {
                user: address,
                groupAddress: groupId,
                groupType,
                groupStatus: groupState,
                memberCount: members.length,
                contribution: contribution.toString(),
                userBalance: balance.toString(),
                allowance: allowance.toString(),
                hasSufficientBalance: balance >= contribution,
                hasSufficientAllowance: allowance >= contribution
            });

            if (balance < contribution) {
                throw new Error(`Insufficient USDC Balance. You have ${parseUnits(balance.toString(), -6)} but need ${parseUnits(contribution.toString(), -6)}`);
            }

            // 4. Approve if needed (spender = groupId)
            if (allowance < contribution) {
                console.log(`Requesting Approval for Group: ${groupId}`);
                setStatus('approving');

                const approvalHash = await writeContractAsync({
                    address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                    abi: USDCABI,
                    functionName: 'approve',
                    args: [groupId, contribution],
                });

                setStatus('confirming_approval');
                await waitForTransactionReceipt(config, { hash: approvalHash });
                console.log("Approval Confirmed");

                // 4.5 WAIT LOOP: Ensure allowance is updated on-chain before proceeding
                console.log("Verifying allowance on-chain...");
                let retries = 0;
                while (retries < 15) { // Try for ~30 seconds
                    await sleep(2000);
                    allowance = await readContract(config, {
                        address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                        abi: USDCABI,
                        functionName: 'allowance',
                        args: [address, groupId],
                    }) as bigint;

                    console.log(`Allowance Check #${retries + 1}: ${allowance.toString()}`);
                    if (allowance >= contribution) {
                        console.log("Allowance verified!");
                        break;
                    }
                    retries++;
                }

                if (allowance < contribution) {
                    throw new Error("Approval confirmed but allowance not updated. Please try again.");
                }
            }

            // 5. Join Group
            setStatus('joining');
            const joinHash = await writeContractAsync({
                address: groupId as `0x${string}`,
                abi: groupABI,
                functionName: 'join',
                args: [],
            });

            setTxHash(joinHash);
            setStatus('confirming_creation'); // Re-using state for "Waiting for tx"
            await waitForTransactionReceipt(config, { hash: joinHash });
            setStatus('success');

        } catch (err: any) {
            console.error("Join Group Error:", err);
            setStatus('error');
            // Surface revert reason if available
            const reason = err.shortMessage || err.message || "Failed to join group";
            setError(reason);
        }
    };

    const lockGroup = async (groupId: string) => {
        try {
            const hash = await writeContractAsync({
                address: groupId as `0x${string}`,
                abi: StandardGroupABI,
                functionName: 'lock',
                args: [],
            });
            await waitForTransactionReceipt(config, { hash });
        } catch (err) {
            console.error(err);
        }
    };

    const placeBid = async (groupId: string, amount: string) => {
        try {
            if (!address) return;
            // Approval logic similar to above needed if bid transfers funds immediately
            // Assuming bid transfers USDC to contract
            const amountBig = parseUnits(amount, 6);

            const allowance = await readContract(config, {
                address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                abi: USDCABI,
                functionName: 'allowance',
                args: [address, groupId],
            }) as bigint;

            if (allowance < amountBig) {
                const approvalHash = await writeContractAsync({
                    address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                    abi: USDCABI,
                    functionName: 'approve',
                    args: [groupId, amountBig],
                });
                await waitForTransactionReceipt(config, { hash: approvalHash });
            }

            await writeContractAsync({
                address: groupId as `0x${string}`,
                abi: StandardGroupABI,
                functionName: 'bid',
                args: [amountBig],
            });
        } catch (err) {
            console.error(err);
        }
    };

    const resolveRound = async (groupId: string) => {
        try {
            if (!address) return;
            setStatus('creating'); // Reuse 'creating' status for generic loading
            const hash = await writeContractAsync({
                address: groupId as `0x${string}`,
                abi: AuctionGroupABI, // Use Auction ABI
                functionName: 'resolveRound',
                args: [],
            });
            setStatus('confirming_creation');
            await waitForTransactionReceipt(config, { hash });
            setStatus('success');
        } catch (err: any) {
            console.error("Resolve Round Error:", err);
            setStatus('error');
            setError(err.shortMessage || err.message);
        }
    };

    return {
        createGroup,
        joinGroup,
        lockGroup,
        placeBid,
        resolveRound,
        status, // Expose status for UI feedback
        error,
        txHash
    };
}
