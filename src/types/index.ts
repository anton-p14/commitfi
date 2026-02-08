export type GroupType = "STANDARD" | "AUCTION";
export type GroupStatus = "RECRUITING" | "LOCKED" | "ACTIVE" | "COMPLETED";
export type CycleFrequency = "MONTHLY" | "WEEKLY" | "BIWEEKLY";

export interface Group {
    id: string; // Contract Address
    name: string;
    type: GroupType;
    contribution: number; // USDC Amount (formatted)
    members: string[]; // List of wallet addresses
    memberLimit: number;
    frequency: CycleFrequency;
    startDate: string | null;
    status: GroupStatus;
    createdBy: string;
    currentCycle?: number;
    totalRounds?: number;
}

// Ensure Page type is accessible if needed, or import from App.tsx
// (App.tsx currently exports Page)
