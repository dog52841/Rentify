interface LeaveReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: any;
    reviewerId: string;
    revieweeId: string;
    onReviewSubmitted: () => void;
}
declare const LeaveReviewModal: ({ isOpen, onClose, booking, reviewerId, revieweeId, onReviewSubmitted }: LeaveReviewModalProps) => import("react/jsx-runtime").JSX.Element | null;
export default LeaveReviewModal;
