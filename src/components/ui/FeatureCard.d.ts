import type { ElementType } from 'react';
interface FeatureCardProps {
    icon: ElementType;
    title: string;
    description: string;
    iconContainerClassName?: string;
    iconClassName?: string;
}
declare const FeatureCard: ({ icon: Icon, title, description, iconContainerClassName, iconClassName }: FeatureCardProps) => import("react/jsx-runtime").JSX.Element;
export default FeatureCard;
