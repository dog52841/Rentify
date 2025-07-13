import type { ElementType } from 'react';

interface FeatureCardProps {
  icon: ElementType;
  title: string;
  description: string;
  iconContainerClassName?: string;
  iconClassName?: string;
}

const FeatureCard = ({ icon: Icon, title, description, iconContainerClassName, iconClassName }: FeatureCardProps) => (
  <div className="bg-card rounded-xl p-8 text-center space-y-4 border h-full">
    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ring-8 ${iconContainerClassName || 'bg-primary/5 ring-primary/5'}`}>
      <Icon className={`h-8 w-8 ${iconClassName || 'text-primary'}`} />
    </div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default FeatureCard; 