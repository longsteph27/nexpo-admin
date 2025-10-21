import clsx from 'clsx';
import React from 'react';

interface ContainerHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export default function ContainerHeader({ children, className }: ContainerHeaderProps) {
    return (
        <div className={clsx("w-full mx-auto", className)}>
            {children}
        </div>
    );
}