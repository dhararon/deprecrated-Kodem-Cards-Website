import React from 'react';

const LoadingFallback: React.FC<{ message?: string }> = ({
    message = 'Cargando...'
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-4">
            <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin mb-4" />
            <p className="text-sm text-gray-500">{message}</p>
        </div>
    );
};

export default LoadingFallback; 