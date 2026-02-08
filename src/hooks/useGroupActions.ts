import { useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { parseUnits, parseGwei } from 'viem';
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

    // Gas Overrides for Arc Chain
    const gasOverrides = {
        maxFeePerGas: parseGwei('200'),
        maxPriorityFeePerGas: parseGwei('2.5'),
    };

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
                    ...gasOverrides,
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
                ...gasOverrides,
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

    const joinGroup = async (groupId: string) => {
        try {
            setStatus('checking_allowance');
            setError(null);
            if (!address) throw new Error("Wallet not connected");

            // Fetch contribution amount first
            const contribution = await readContract(config, {
                address: groupId as `0x${string}`,
                abi: StandardGroupABI,
                functionName: 'contribution',
                args: []
            }) as bigint;

            // Check Allowance
            const allowance = await readContract(config, {
                address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                abi: USDCABI,
                functionName: 'allowance',
                args: [address, groupId], // User approves the GROUP contract to spend their USDC
            }) as bigint;

            if (allowance < contribution) {
                setStatus('approving');
                const approvalHash = await writeContractAsync({
                    address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                    abi: USDCABI,
                    functionName: 'approve',
                    args: [groupId, contribution],
                    ...gasOverrides,
                });

                setStatus('confirming_approval');
                await waitForTransactionReceipt(config, { hash: approvalHash });
            }

            setStatus('joining');
            const joinHash = await writeContractAsync({
                address: groupId as `0x${string}`,
                abi: StandardGroupABI,
                functionName: 'join',
                args: [],
                ...gasOverrides,
            });

            setTxHash(joinHash);
            setStatus('confirming_creation'); // Re-using state for "Waiting for tx"
            await waitForTransactionReceipt(config, { hash: joinHash });
            setStatus('success');

        } catch (err: any) {
            console.error("Join Group Error:", err);
            setStatus('error');
            setError(err.shortMessage || err.message || "Failed to join group");
        }
    };

    const lockGroup = async (groupId: string) => {
        try {
            const hash = await writeContractAsync({
                address: groupId as `0x${string}`,
                abi: StandardGroupABI,
                functionName: 'lock',
                args: [],
                ...gasOverrides,
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
                    ...gasOverrides,
                });
                await waitForTransactionReceipt(config, { hash: approvalHash });
            }

            await writeContractAsync({
                address: groupId as `0x${string}`,
                abi: StandardGroupABI,
                functionName: 'bid',
                args: [amountBig],
                ...gasOverrides,
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
                ...gasOverrides,
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
