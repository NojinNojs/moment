import { Button } from "@/components/ui/button"
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-24 bg-accent">
      <div className="container max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center space-y-8 bg-card/10 backdrop-blur-sm p-10 md:p-14 rounded-2xl shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Ready to Take Control of Your Finances?
          </motion.h2>
          <motion.p 
            className="text-xl text-accent-foreground/90 max-w-2xl mx-auto px-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Join thousands of users who have transformed their financial habits with Moment.
            Start your journey to financial wellness today.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center pt-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {/* direct to register page */}
              <Button size="lg" className="bg-primary w-full sm:w-auto px-8 py-6 text-lg">Get Started Now</Button>
            </motion.div> 
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTASection