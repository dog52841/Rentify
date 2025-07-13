interface CallToActionProps {
    title: string;
    description: string;
    primaryActionText: string;
    primaryActionLink: string;
    secondaryActionText?: string;
    secondaryActionLink?: string;
}
declare const CallToAction: ({ title, description, primaryActionText, primaryActionLink, secondaryActionText, secondaryActionLink }: CallToActionProps) => import("react/jsx-runtime").JSX.Element;
export default CallToAction;
