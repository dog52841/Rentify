import { motion } from 'framer-motion';
import { ShieldCheck, MessageCircle, Users, Camera } from 'lucide-react';

const SafetyTipsPage = () => {

    const tipsForRenters = [
        { icon: MessageCircle, title: "Communicate on Rentify", description: "Always use our secure messaging system to communicate with owners. Never share personal contact information like phone numbers or email addresses until a booking is confirmed." },
        { icon: Users, title: "Meet in Public Places", description: "When possible, arrange to meet the owner in a well-lit, public place to pick up the item. Bring a friend with you if it makes you feel more comfortable." },
        { icon: Camera, title: "Document the Item's Condition", description: "Before you leave with the item, take a few photos to document its condition. This helps prevent any disputes about damages later on." }
    ];

    const tipsForOwners = [
        { icon: Users, title: "Review Renter Profiles", description: "Take a moment to review the profile of a renter before accepting a booking. Look for verified information and reviews from other owners." },
        { icon: ShieldCheck, title: "Never Ship an Item", description: "Our platform is designed for local, in-person exchanges. Do not ship your item to a renter, as this can expose you to scams." },
        { icon: Camera, title: "Verify Your Item on Return", description: "When the item is returned, inspect it to ensure it's in the same condition. If there are any issues, report them through the platform immediately." }
    ];

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4">Trust & Safety</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Your safety is our top priority. Follow these guidelines to ensure a secure and positive experience for everyone on Rentify.
                    </p>
                </div>
                
                <div className="space-y-12">
                    {/* For Renters */}
                    <div>
                        <h2 className="text-3xl font-bold mb-6">Tips for Renters</h2>
                        <div className="space-y-6">
                            {tipsForRenters.map((tip, i) => (
                                <div key={i} className="flex items-start gap-6 bg-card border p-6 rounded-lg">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <tip.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{tip.title}</h3>
                                        <p className="text-muted-foreground">{tip.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* For Owners */}
                    <div>
                        <h2 className="text-3xl font-bold mb-6">Tips for Owners</h2>
                        <div className="space-y-6">
                            {tipsForOwners.map((tip, i) => (
                                <div key={i} className="flex items-start gap-6 bg-card border p-6 rounded-lg">
                                    <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                                        <tip.icon className="h-6 w-6 text-secondary-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{tip.title}</h3>
                                        <p className="text-muted-foreground">{tip.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

export default SafetyTipsPage; 