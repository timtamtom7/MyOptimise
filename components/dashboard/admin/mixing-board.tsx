"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toggleCapability } from "@/app/actions/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Types
type User = {
    id: string;
    email: string;
    full_name: string;
    role: string;
    avatar_url?: string;
};

type Capability = {
    id: string;
    name: string;
    category: string;
    description: string;
};

type UserCapability = {
    user_id: string;
    capability_id: string;
    granted: boolean;
};

interface MixingBoardProps {
    users: User[];
    capabilities: Capability[];
    userCapabilities: UserCapability[];
}

export function MixingBoard({ users, capabilities, userCapabilities }: MixingBoardProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    
    // Group capabilities by category
    const categories = Array.from(new Set(capabilities.map(c => c.category))).sort();

    // Filtered data
    const filteredCapabilities = capabilities.filter(cap => 
        (selectedCategory === "all" || cap.category === selectedCategory) &&
        (cap.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         (cap.description && cap.description.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const isGranted = (userId: string, capId: string) => {
        return userCapabilities.some(uc => uc.user_id === userId && uc.capability_id === capId && uc.granted);
    };

    const handleToggle = async (userId: string, capId: string, currentState: boolean) => {
        // Optimistic update could go here, but for simplicity we wait for server action revalidation
        await toggleCapability(userId, capId, !currentState);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Input 
                    placeholder="Search capabilities..." 
                    className="max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex gap-2 overflow-x-auto pb-2 max-w-full no-scrollbar">
                    <Badge 
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/90"
                        onClick={() => setSelectedCategory("all")}
                    >
                        All
                    </Badge>
                    {categories.map(cat => (
                        <Badge 
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            className="cursor-pointer capitalize hover:bg-primary/90"
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="border rounded-lg overflow-x-auto shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="p-4 text-left font-medium min-w-[250px] sticky left-0 bg-gray-50/95 backdrop-blur z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Capability</th>
                            {users.map(user => (
                                <th key={user.id} className="p-4 text-center min-w-[120px]">
                                    <div className="flex flex-col items-center gap-2">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                            <AvatarImage src={user.avatar_url} />
                                            <AvatarFallback>{(user.full_name?.[0] || user.email[0]).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold truncate max-w-[100px]" title={user.full_name}>{user.full_name || user.email}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{user.role}</span>
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCapabilities.map(cap => (
                            <tr key={cap.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="p-4 sticky left-0 bg-white z-10 border-r shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                                    <div className="font-mono text-xs text-primary mb-1">{cap.name}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-2">{cap.description}</div>
                                </td>
                                {users.map(user => {
                                    const granted = isGranted(user.id, cap.id);
                                    return (
                                        <td key={`${user.id}-${cap.id}`} className="p-4 text-center">
                                            <div className="flex justify-center">
                                                <Switch 
                                                    checked={granted}
                                                    onCheckedChange={() => handleToggle(user.id, cap.id, granted)}
                                                />
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
