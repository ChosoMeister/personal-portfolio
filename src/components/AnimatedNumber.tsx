
import React, { memo, useEffect, useRef, useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web';

interface AnimatedNumberProps {
    value: number;
    formatter?: (value: number) => string;
    duration?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
}

const AnimatedNumberComponent: React.FC<AnimatedNumberProps> = ({
    value,
    formatter = (v) => v.toLocaleString('fa-IR'),
    duration = 500,
    className = '',
    prefix = '',
    suffix = ''
}) => {
    const prevValue = useRef(value);
    const [isFirstRender, setIsFirstRender] = useState(true);

    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
        }
        prevValue.current = value;
    }, [value, isFirstRender]);

    const { number } = useSpring({
        from: { number: isFirstRender ? value : prevValue.current },
        to: { number: value },
        config: { ...config.gentle, duration },
    });

    return (
        <animated.span className={className}>
            {number.to((n) => `${prefix}${formatter(Math.floor(n))}${suffix}`)}
        </animated.span>
    );
};

export const AnimatedNumber = memo(AnimatedNumberComponent);

// Animated Toman formatter
interface AnimatedTomanProps {
    value: number;
    className?: string;
    showSuffix?: boolean;
}

const AnimatedTomanComponent: React.FC<AnimatedTomanProps> = ({
    value,
    className = '',
    showSuffix = true
}) => {
    return (
        <AnimatedNumber
            value={value}
            formatter={(v) => new Intl.NumberFormat('fa-IR').format(Math.round(v))}
            className={className}
            suffix={showSuffix ? ' تومان' : ''}
        />
    );
};

export const AnimatedToman = memo(AnimatedTomanComponent);

// Animated Percent formatter
interface AnimatedPercentProps {
    value: number;
    className?: string;
    showSign?: boolean;
}

const AnimatedPercentComponent: React.FC<AnimatedPercentProps> = ({
    value,
    className = '',
    showSign = true
}) => {
    const sign = showSign && value > 0 ? '+' : '';

    return (
        <AnimatedNumber
            value={value}
            formatter={(v) => `${sign}${new Intl.NumberFormat('fa-IR', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
            }).format(v)}٪`}
            className={className}
        />
    );
};

export const AnimatedPercent = memo(AnimatedPercentComponent);
