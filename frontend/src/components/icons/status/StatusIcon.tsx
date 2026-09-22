import ErrorIcon from './ErrorIcon';
import InfoIcon from './InfoIcon';
import SuccessIcon from './SuccessIcon';
import WarningIcon from './WarningIcon';

export type StatusType = 'error' | 'info' | 'success' | 'warning';

interface StatusIconProps {
    type: StatusType;
    color?: string;
}

export function StatusIcon({ type, color }: StatusIconProps) {
    const Icon = {
        error: ErrorIcon,
        info: InfoIcon,
        success: SuccessIcon,
        warning: WarningIcon,
    }[type];

    return <Icon color={color} />;
}
