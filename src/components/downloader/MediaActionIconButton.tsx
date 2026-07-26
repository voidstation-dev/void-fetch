import type { ComponentType, SVGProps } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaActionIconButtonProps {
    label: string;
    text?: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    variant?: 'outline' | 'secondary' | 'default';
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    onClick: () => void;
}

export function MediaActionIconButton({
    label,
    text,
    icon: Icon,
    variant = 'outline',
    disabled,
    loading,
    className,
    onClick,
}: MediaActionIconButtonProps) {
    return (
        <Button
            type="button"
            variant={variant}
            size="sm"
            className={cn('h-8 min-w-0 justify-center gap-1.5 px-2.5 text-xs', className)}
            disabled={disabled}
            onClick={onClick}
            aria-label={label}
            title={label}
        >
            {loading ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
                <Icon className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{text ?? label}</span>
        </Button>
    );
}
