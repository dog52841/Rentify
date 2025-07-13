import { motion } from 'framer-motion';

const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="prose dark:prose-invert max-w-none"
      >
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <p className="lead">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <p>
          Welcome to Rentify! These terms and conditions outline the rules and regulations for the use of Rentify's Website, located at rentify.com. By accessing this website we assume you accept these terms and conditions. Do not continue to use Rentify if you do not agree to take all of the terms and conditions stated on this page.
        </p>

        <h2>1. Introduction</h2>
        <p>
          The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: "Client", "You" and "Your" refers to you, the person log on this website and compliant to the Company's terms and conditions. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company. "Party", "Parties", or "Us", refers to both the Client and ourselves.
        </p>

        <h2>2. License</h2>
        <p>
          Unless otherwise stated, Rentify and/or its licensors own the intellectual property rights for all material on Rentify. All intellectual property rights are reserved. You may access this from Rentify for your own personal use subjected to restrictions set in these terms and conditions.
        </p>
        <p>You must not:</p>
        <ul>
          <li>Republish material from Rentify</li>
          <li>Sell, rent or sub-license material from Rentify</li>
          <li>Reproduce, duplicate or copy material from Rentify</li>
          <li>Redistribute content from Rentify</li>
        </ul>

        <h2>3. User-Generated Content</h2>
        <p>
          Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. Rentify does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of Rentify, its agents and/or affiliates. Comments reflect the views and opinions of the person who post their views and opinions.
        </p>
        
        <h2>4. Booking and Financial Terms</h2>
        <p>
          By creating a listing, you as an Owner agree to our pricing and payment terms. By booking an item, you as a Renter agree to pay all fees associated with the rental. All payments are processed through a secure third-party payment gateway. Rentify is not responsible for any issues arising from the payment process.
        </p>

        <h2>5. Limitation of Liability</h2>
        <p>
          In no event shall Rentify, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. Rentify, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.
        </p>

        <h2>6. Changes to Terms</h2>
        <p>
          We reserve the right to revise these terms and conditions at any time as it sees fit, and by using this Website you are expected to review these terms on a regular basis.
        </p>

      </motion.div>
    </div>
  );
};

export default TermsPage; 