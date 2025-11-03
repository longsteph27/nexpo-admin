'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BasicInformationStepProps {
    category: string;
    setCategory: (value: string) => void;
    name: string;
    setName: (value: string) => void;
}

const BasicInformationStep = ({
    category,
    setCategory,
    name,
    setName,
}: BasicInformationStepProps) => {
    return (
        <div className="bg-white p-8 relative h-full">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-content-primary">Basic Information</h2>
                    <p className="text-xs text-content-tertiary mt-2">* indicates a required field</p>
                </div>

                <div className="space-y-8">
                    <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                            Event Category<span className="text-red-500">*</span>
                        </label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="lg:w-52 w-32">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Design">Design</SelectItem>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Input
                        label="Event Name*"
                        placeholder="Vietnam Design Connnect 2025"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    />

                    <div className="text-xs text-content-tertiary flex items-center gap-2">
                        <Icon icon="lucide:info" className="w-4 h-4" />
                        1/3 - Your fancy event name
                    </div>
                    <div className="hidden" />
                </div>
            </div>
        </div>
    );
}

export default BasicInformationStep;
