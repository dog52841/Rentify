import { motion } from 'framer-motion';
import { Target, Users, Zap, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import CallToAction from '../components/ui/CallToAction';
import FeatureCard from '../components/ui/FeatureCard';

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

const AboutPage = () => {

  const values = [
    { icon: Target, title: "Purpose-Driven", description: "We believe in a world where people can live more by owning less. Our mission is to reduce waste and make a positive impact on the planet." },
    { icon: Users, title: "Community-Focused", description: "We're building more than a platform; we're building a community of trust where people can confidently share with their neighbors." },
    { icon: Zap, title: "Seamless Experience", description: "From browsing to booking, we prioritize a simple, intuitive, and secure experience for both renters and owners." },
    { icon: Leaf, title: "Sustainable Living", description: "By enabling peer-to-peer rentals, we empower individuals to make sustainable choices that benefit everyone." }
  ];

  const team = [
    { name: "Dio Dog", role: "Mascot & Head of Security", avatar: "/dio-dog.jpg" },
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold">We're Changing How People Access Things</h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-3xl mx-auto">
            Rentify was born from a simple idea: what if we could have access to everything we need without having to own it all? We're on a mission to create a more sustainable and community-driven future, one rental at a time.
          </p>
        </motion.div>
      </section>

      {/* Our Values */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center">Our Core Values</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
            >
              <FeatureCard 
                icon={value.icon}
                title={value.title}
                description={value.description}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>
      
      {/* Our Team */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center">Meet the Team</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 justify-center">
          {team.map((member, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-center"
            >
              <img src={member.avatar} alt={member.name} className="w-40 h-40 rounded-full mx-auto mb-4 border-4 border-primary/20 shadow-lg object-cover" />
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-primary font-medium">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <CallToAction 
        title="Join Our Growing Community"
        description="Be part of the movement towards a more sustainable future."
        primaryActionText="Start Browsing"
        primaryActionLink="/browse"
        secondaryActionText="Become a Member"
        secondaryActionLink="/auth"
      />
    </div>
  );
};

export default AboutPage; 