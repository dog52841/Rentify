import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/card';
import { motion } from 'framer-motion';
import { AnimatedSection } from '../components/ui/AnimatedSection';

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <AnimatedSection>
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto shadow-xl border-primary/10">
          <CardContent className="p-8 sm:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 py-6 text-center"
            >
              <div className="bg-amber-100 p-4 rounded-full">
                <AlertCircle className="h-16 w-16 text-amber-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold">Payment Cancelled</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Your payment process was cancelled. No charges have been made to your account.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full max-w-md">
                <Button
                  onClick={() => navigate(-1)}
                  className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/browse">Browse Listings</Link>
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </AnimatedSection>
  );
};

export default PaymentCancelPage; 