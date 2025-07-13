import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Button } from './Button';
const CallToAction = ({ title, description, primaryActionText, primaryActionLink, secondaryActionText, secondaryActionLink }) => {
    return (_jsx("section", { children: _jsxs("div", { className: "relative bg-muted rounded-3xl p-8 md:p-12 overflow-hidden", children: [_jsx("div", { className: "absolute -top-10 -right-10 w-40 h-40 bg-background/50 rounded-full", "aria-hidden": "true" }), _jsx("div", { className: "absolute -bottom-16 -left-10 w-52 h-52 bg-background/50 rounded-full", "aria-hidden": "true" }), _jsxs("div", { className: "relative z-10 max-w-4xl mx-auto text-center space-y-6", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold", children: title }), _jsx("p", { className: "text-xl text-muted-foreground", children: description }), _jsxs("div", { className: "flex flex-col sm:flex-row justify-center gap-4", children: [_jsx(Button, { asChild: true, size: "lg", children: _jsx(Link, { to: primaryActionLink, children: primaryActionText }) }), secondaryActionText && secondaryActionLink && (_jsx(Button, { asChild: true, variant: "secondary", size: "lg", children: _jsx(Link, { to: secondaryActionLink, children: secondaryActionText }) }))] })] })] }) }));
};
export default CallToAction;
