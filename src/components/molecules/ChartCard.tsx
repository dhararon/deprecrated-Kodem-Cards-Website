import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
    description?: string;
    className?: string;
}

export function ChartCard({ title, children, description, className = '' }: ChartCardProps) {
    return (
        <Card className={`${className}`}>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    {title}
                </CardTitle>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
}

interface SimpleBarChartProps {
    data: Array<{
        label: string;
        value: number;
        percentage?: number;
        color?: string;
    }>;
    maxValue?: number;
}

export function SimpleBarChart({ data, maxValue }: SimpleBarChartProps) {
    const max = maxValue || Math.max(...data.map(item => item.value));
    
    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                    <div className="w-20 text-xs text-muted-foreground truncate">
                        {item.label}
                    </div>
                    <div className="flex-1 flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    item.color || 'bg-primary'
                                }`}
                                style={{
                                    width: `${(item.value / max) * 100}%`
                                }}
                            />
                        </div>
                        <div className="text-xs font-medium w-8">
                            {item.value}
                        </div>
                        {item.percentage !== undefined && (
                            <Badge variant="secondary" className="text-xs px-1">
                                {item.percentage}%
                            </Badge>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

interface PieChartLegendProps {
    data: Array<{
        label: string;
        value: number;
        percentage: number;
        color: string;
    }>;
}

export function PieChartLegend({ data }: PieChartLegendProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
        <div className="space-y-2">
            {data.map((item, index) => (
                <div key={index} className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                        <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                            {item.label}
                        </span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">
                            {item.value.toLocaleString()}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                            {item.percentage}%
                        </Badge>
                    </div>
                </div>
            ))}
            <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-sm font-bold">{total.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}