import { Link } from 'react-router-dom';
import { Button } from './Button';

interface CallToActionProps {
    title: string;
    description: string;
    primaryActionText: string;
    primaryActionLink: string;
    secondaryActionText?: string;
    secondaryActionLink?: string;
}

const CallToAction = ({ title, description, primaryActionText, primaryActionLink, secondaryActionText, secondaryActionLink }: CallToActionProps) => {
    return (
        <section>
            <div className="relative bg-muted rounded-3xl p-8 md:p-12 overflow-hidden">
                <div 
                    className="absolute -top-10 -right-10 w-40 h-40 bg-background/50 rounded-full"
                    aria-hidden="true"
                />
                <div 
                    className="absolute -bottom-16 -left-10 w-52 h-52 bg-background/50 rounded-full"
                    aria-hidden="true"
                />
                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
                    <p className="text-xl text-muted-foreground">
                        {description}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button asChild size="lg">
                            <Link to={primaryActionLink}>
                                {primaryActionText}
                            </Link>
                        </Button>
                        {secondaryActionText && secondaryActionLink && (
                             <Button asChild variant="secondary" size="lg">
                                <Link to={secondaryActionLink}>
                                    {secondaryActionText}
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CallToAction; 