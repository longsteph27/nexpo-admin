import clsx from 'clsx';
import React from 'react';

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
}

export default function Container({ children, className }: ContainerProps) {
    return (
        <div className={clsx("max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6", className)}>{children}</div>
    );
}