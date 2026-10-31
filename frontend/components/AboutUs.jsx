import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import '../pages/theme.css'


const AboutUs = () => {
  const { theme } = useTheme();

  return (
    <section id="about" className="py-16">
      <div
        className={`container mx-auto px-6 transition-colors duration-300 ${
          theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-center">
          
          {/* Text Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:w-1/2 lg:pr-12 mb-8 lg:mb-0"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Our Mission
            </div>

            <h2 className={`text-3xl lg:text-4xl font-bold mb-5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              About <span className="text-blue-600">Health</span><span className="text-emerald-600">Link</span>
            </h2>
            
            <p className={`mb-4 text-base leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              <strong className="text-blue-600 font-semibold">HealthLink</strong> was founded with a simple mission: to make quality healthcare accessible, transparent, and connected for everyone.
              We bridge the gap between patients and medical professionals, making it seamless to find and
              consult with verified specialists when you need them most.
            </p>
            
            <p className={`mb-4 text-base leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              Our platform leverages modern communication technology to simplify scheduling, instant video consultations, real-time messaging, and secure records. We are committed to empowering patients and doctors through clinical innovation.
            </p>
            
            <p className={`text-base leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              With <strong className="text-emerald-600 font-semibold">HealthLink</strong>, you take complete control of your healthcare journey with confidence, backed by certified medical professionals just a click away.
            </p>
          </motion.div>

          {/* Pictorial Image Section: Doctor caring for patient */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:w-1/2 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
              <img 
                src="/images/doctor-patient-care.jpg" 
                alt="Doctor consulting with patient" 
                className="w-full h-[450px] object-cover object-center transform hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Care in Action</p>
                  <p className="text-lg font-bold">Compassionate Patient Consultations</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/90 backdrop-blur-md text-white border border-blue-400">
                  Board Certified
                </span>
              </div>
            </div>

            {/* Floating verification badge */}
            <div className="absolute -bottom-5 -left-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 font-bold text-lg">
                ✓
              </div>
              <div>
                <p className="text-xs text-slate-500">Clinical Standard</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">100% Verified Practitioners</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
