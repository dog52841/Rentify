import { motion } from 'framer-motion';

const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="prose dark:prose-invert max-w-none"
      >
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="lead">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <p>
          At Rentify, accessible from rentify.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Rentify and how we use it. If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information. This includes:
        </p>
        <ul>
            <li><strong>Account Information:</strong> When you register for an account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number.</li>
            <li><strong>Transaction Information:</strong> We collect information related to your rentals and bookings, including the date and time, amounts charged, and other related transaction details.</li>
            <li><strong>User Content:</strong> We collect the content you submit to the Services. This includes photos, reviews, and messages between users.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect in various ways, including to:</p>
        <ul>
          <li>Provide, operate, and maintain our website</li>
          <li>Improve, personalize, and expand our website</li>
          <li>Understand and analyze how you use our website</li>
          <li>Develop new products, services, features, and functionality</li>
          <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
          <li>Process your transactions and prevent fraud</li>
        </ul>

        <h2>3. Log Files and Cookies</h2>
        <p>
            Rentify follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
        </p>
        <p>
            Like any other website, Rentify uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
        </p>

        <h2>4. Third-Party Privacy Policies</h2>
        <p>
          Rentify's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
        </p>
        
        <h2>5. Your Data Protection Rights</h2>
        <p>
            We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
        </p>
        <ul>
            <li>The right to access – You have the right to request copies of your personal data.</li>
            <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate.</li>
            <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
        </ul>

      </motion.div>
    </div>
  );
};

export default PrivacyPage; 