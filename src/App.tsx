import { useState, useEffect } from 'react';
import { ConnectWallet } from './components/pages/ConnectWallet';
import { Dashboard } from './components/pages/Dashboard';
import { MyGroups } from './components/pages/MyGroups';
import { JoinGroup } from './components/pages/JoinGroup';
import { CreateGroup } from './components/pages/CreateGroup';
import { GroupDetail } from './components/pages/GroupDetail';
import { Header } from './components/Header';
import { WagmiProvider, useAccount, useDisconnect } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

export type Page = 'connect' | 'dashboard' | 'my-groups' | 'join-group' | 'create-group' | 'group-detail';

const queryClient = new QueryClient();

function AppContent() {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    // Initialize page based on connection status
    const [currentPage, setCurrentPage] = useState<Page>('connect');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // Sync page with connection status
    useEffect(() => {
        if (isConnected && currentPage === 'connect') {
            setCurrentPage('dashboard');
        } else if (!isConnected && currentPage !== 'connect') {
            setCurrentPage('connect');
        }
    }, [isConnected, currentPage]);

    const navigateTo = (page: Page, groupId?: string) => {
        setCurrentPage(page);
        if (groupId) setSelectedGroupId(groupId);
    };

    const handleDisconnect = () => {
        disconnect();
        // useEffect will handle redirection
    };

    if (!isConnected) {
        // Pass a dummy onConnect for now, ConnectWallet will be updated to use ConnectButton
        return <ConnectWallet />;
    }

    return (
        <div className="min-h-screen bg-[#0a0e1a]">
            <Header
                walletAddress={address || null}
                onDisconnect={handleDisconnect}
                onNavigate={navigateTo}
            />

            {currentPage === 'dashboard' && <Dashboard onNavigate={navigateTo} />}
            {currentPage === 'my-groups' && <MyGroups onNavigate={navigateTo} walletAddress={address || null} />}
            {currentPage === 'join-group' && <JoinGroup onNavigate={navigateTo} walletAddress={address || null} />}
            {currentPage === 'create-group' && <CreateGroup onNavigate={navigateTo} walletAddress={address || null} />}
            {currentPage === 'group-detail' && <GroupDetail groupId={selectedGroupId} onNavigate={navigateTo} />}
        </div>
    );
}

export default function App() {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme()}>
                    <AppContent />
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
