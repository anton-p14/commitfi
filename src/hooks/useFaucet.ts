
import { useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
// Note: Using standard ERC20 ABI might not have 'mint', need specific interface or just raw calls if simple.
// Actually, let's create a minimal ABI for minting if MockUSDC.json isn't available with it.

export const MINT_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export function useFaucet() {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [isMinting, setIsMinting] = useState(false);

    const mintTokens = async () => {
        if (!address) return;
        try {
            setIsMinting(true);
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                abi: MINT_ABI,
                functionName: 'mint',
                args: [address, parseUnits('1000', 6)], // Mint 1000 USDC
            });
            console.log("Mint Tx:", hash);
            // Optionally wait for receipt, but for faucet 'fire and forget' is often okay for UX speed
            // pending verification via Balance hook
        } catch (error) {
            console.error("Mint failed:", error);
        } finally {
            setIsMinting(false);
        }
    };

    return { mintTokens, isMinting };
}
