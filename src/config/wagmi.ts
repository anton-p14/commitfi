import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, fallback } from 'wagmi';
import { type Chain } from 'wagmi/chains';

// Define Arc Chain Testnet
const arcTestnet = {
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://rpc.testnet.arc.network',
                'https://arc-testnet.rpc.thirdweb.com'
            ]
        },
        public: {
            http: ['https://rpc.testnet.arc.network',
                'https://arc-testnet.rpc.thirdweb.com'
            ]
        },
    },
    blockExplorers: {
        default: { name: 'ArcScan', url: 'https://explorer.testnet.arc.network' },
    },
    testnet: true,
} as const satisfies Chain;

export const config = getDefaultConfig({
    appName: 'CommitFi',
    projectId: 'c0f75704172f310df66f578b668d2975', // Public generic ID for demo/testing
    chains: [arcTestnet],
    transports: {
        [arcTestnet.id]: fallback([
            http('https://rpc.testnet.arc.network'),
            http('https://arc-testnet.rpc.thirdweb.com'),
        ]),
    },
    ssr: true, // If using Next.js or similar, good practice
});
