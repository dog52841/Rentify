interface ReportUserDialogProps {
    userId: string;
    userName: string;
    trigger?: React.ReactNode;
    onReportComplete?: () => void;
}
export declare const ReportUserDialog: ({ userId, userName, trigger, onReportComplete, }: ReportUserDialogProps) => import("react/jsx-runtime").JSX.Element;
export {};
