import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Moment has completely transformed how I manage my finances. The simple tracking tools have helped me develop a consistent saving habit.",
    name: "Zev Hadid",
    role: "Student",
    avatar: "Z",
  },
  {
    quote:
      "I've tried many finance apps, but this is the first one that actually helps me understand my spending patterns and improve my financial decisions.",
    name: "Christian J.",
    role: "Fresh Graduate",
    avatar: "C",
  },
  {
    quote:
      "The intuitive dashboard gives me all the information I need at a glance. Since using Moment, I've been able to save more each month.",
    name: "Michelle A.",
    role: "Software Developer",
    avatar: "M",
  },
];

const TestimonialSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 80 },
    },
  };

  return (
    <section className="py-24">
      <div className="container max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
        <motion.div 
          className="text-center mb-20 space-y-5 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Success Stories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Join thousands of users who have improved their financial habits and taken control of their money
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-lg transition-all"
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <div className="flex flex-col items-center">
                <div className="mb-6 text-4xl text-primary text-center">❝</div>
                <p className="mb-8 italic text-center leading-relaxed">{testimonial.quote}</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-xl font-bold text-primary">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialSection;
