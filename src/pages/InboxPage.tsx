import InboxPageComponent from '../components/inbox/InboxPage';
import { PageTransition } from '../components/ui/AnimatedSection';

const InboxPage = () => {
  return (
    <PageTransition>
      <InboxPageComponent />
    </PageTransition>
  );
};

export default InboxPage; 