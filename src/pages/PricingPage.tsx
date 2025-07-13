import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const PricingPage = () => {
    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Focus on sharing, not on fees. We handle the hard parts so you can rent and earn with confidence.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Renter */}
                    <div className="bg-card border rounded-lg p-8 space-y-6">
                        <h2 className="text-2xl font-bold">For Renters</h2>
                        <p className="text-muted-foreground">Pay for what you rent, that's it. We add a small service fee to help us run the platform and provide support.</p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5"/> Secure Payments</li>
                            <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5"/> Damage Protection Options</li>
                            <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5"/> 24/7 Community Support</li>
                        </ul>
                        <p className="text-sm text-muted-foreground pt-4 border-t">A small, variable service fee is added at checkout.</p>
                    </div>

                    {/* Owner */}
                    <div className="bg-card border rounded-lg p-8 space-y-6">
                        <h2 className="text-2xl font-bold">For Owners</h2>
                        <p className="text-muted-foreground">Listing is free. We only take a small commission from your earnings after a successful rental.</p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5"/> Free Unlimited Listings</li>
                            <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5"/> Owner Protection Guarantee</li>
                            <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5"/> Fast & Secure Payouts</li>
                        </ul>
                         <p className="text-sm text-muted-foreground pt-4 border-t">A 3% commission is deducted from your rental earnings.</p>
                    </div>
                </div>

                <div className="text-center mt-16">
                    <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Join thousands of users saving money and reducing waste.</p>
                    <Link to="/auth">
                        <Button size="lg">Sign Up for Free</Button>
                    </Link>
                </div>

            </motion.div>
        </div>
    );
};

export default PricingPage; 