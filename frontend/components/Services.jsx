import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { CalendarCheck2, MessagesSquare, FileText, Stethoscope } from 'lucide-react';
const serviceItems = [
  {
    icon: CalendarCheck2,
    title: "Book Appointments",
    description: "Schedule appointments with doctors across various specialties with just a few clicks."
  },
  {
    icon: Stethoscope,
    title: "Find Specialists",
    description: "Search for specialists by expertise, location, availability, and patient ratings."
  },
  {
    icon: MessagesSquare,
    title: "Online Consultations",
    description: "Connect with healthcare professionals through secure video consultations."
  },
  {
    icon: FileText,
    title: "Health Records",
    description: "Maintain your medical history and share it securely with your healthcare providers."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const Services = () => {
  const { theme } = useTheme();

  return (
    <section
      id="services"
      className={`py-18 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'} transition-colors duration-300`}
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`text-3xl md:text-4xl font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 transition-colors duration-300`}
          >
            Our Services
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className={`text-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} max-w-2xl mx-auto transition-colors duration-300`}
          >
            We provide a comprehensive platform to connect patients with healthcare professionals.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {serviceItems.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`${theme === 'dark'
                  ? 'bg-slate-800 border border-slate-700 hover:border-slate-600 text-white'
                  : 'bg-white border border-slate-200 hover:shadow-xl text-slate-900'
                } p-7 rounded-2xl shadow-sm transition-all duration-300`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                <service.icon className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2 transition-colors duration-300`}>
                {service.title}
              </h3>
              <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} transition-colors duration-300 leading-relaxed`}>
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Doctor & Patient Pictorial Consultation Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 relative rounded-3xl overflow-hidden shadow-2xl border border-blue-100 dark:border-slate-800"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('/images/consultation-doctor-patient.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/85 to-transparent lg:to-blue-900/30" />
          
          <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-2xl text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Human-Centered Medicine
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
              Real Care Between Real Doctors & Patients
            </h3>
            <p className="text-blue-100 text-base sm:text-lg mb-8 leading-relaxed">
              Experience the comfort of dedicated clinical attention. Whether via instant encrypted telemedicine or clinical scheduling, HealthLink puts the doctor-patient relationship first.
            </p>
            <div className="flex flex-wrap gap-6 items-center">
              <a
                href="#contact"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all"
              >
                Schedule Consultation
              </a>
              <span className="text-sm text-blue-200 font-medium">
                ⭐ 4.9/5 Average Patient Rating Across 15,000+ Reviews
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;