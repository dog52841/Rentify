import { motion } from 'framer-motion';
import { Search, Calendar, ShieldCheck, UserCheck, DollarSign, Camera, MessageSquare, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import FeatureCard from '../components/ui/FeatureCard';
import CallToAction from '../components/ui/CallToAction';
import { useAuth } from '../contexts/AuthContext';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

const HowItWorksPage = () => {
  const { session } = useAuth();
  const isLoggedIn = session !== null;

  const forRenters = [
    { icon: Search, title: "Discover & Find", description: "Use our powerful search and filters to find the exact item you need from thousands of local listings." },
    { icon: Calendar, title: "Book Your Dates", description: "Select your desired rental period and book the item instantly. Our calendar system prevents double-bookings." },
    { icon: ShieldCheck, title: "Pay Securely", description: "Your payment is held securely by us and is only released to the owner 24 hours after you've received the item." },
    { icon: Truck, title: "Arrange Pickup or Delivery", description: "Coordinate with the owner through our secure messaging system to arrange a convenient pickup or delivery." },
  ];

  const forOwners = [
    { icon: Camera, title: "List Your Item", description: "Take a few photos, write a clear description, and set your price. Listing an item takes less than 5 minutes." },
    { icon: UserCheck, title: "Approve Requests", description: "You have full control. Review rental requests and profiles before approving a booking for your item." },
    { icon: MessageSquare, title: "Coordinate Handover", description: "Use our built-in chat to communicate with the renter and arrange a smooth and safe handover." },
    { icon: DollarSign, title: "Get Paid", description: "Payment is transferred directly to your account after the rental period begins. It's a simple way to earn extra cash." },
  ];

  return (
    <div className="space-y-20">
      {/* Page Header */}
      <section className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold">How Rentify Works</h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          A simple, secure, and seamless rental experience for everyone involved.
        </p>
      </section>

      {/* For Renters */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center">For Renters</h2>
          <p className="text-muted-foreground text-center mt-2">Find and rent what you need in four easy steps.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {forRenters.map((step, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
            >
              <FeatureCard 
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* For Owners */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center">For Owners</h2>
          <p className="text-muted-foreground text-center mt-2">Earn money from your unused items with full peace of mind.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {forOwners.map((step, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
            >
              <FeatureCard 
                icon={step.icon}
                title={step.title}
                description={step.description}
                iconContainerClassName="bg-secondary/10 ring-secondary/5"
                iconClassName="text-secondary-foreground"
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      {!isLoggedIn && (
        <CallToAction 
          title="Ready to Get Started?"
          description="Join our community today. It's free to sign up and start browsing or listing."
          primaryActionText="Browse Items"
          primaryActionLink="/browse"
          secondaryActionText="Start Listing"
          secondaryActionLink="/auth"
        />
      )}
    </div>
  );
};

export default HowItWorksPage; 