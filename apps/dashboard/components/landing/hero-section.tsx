"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, MessageSquare, Zap, Shield, Star } from "lucide-react"
import Link from "next/link"

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
}

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" aria-hidden="true" />
      
      {/* Animated Background Elements */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        aria-hidden="true"
      >
        {/* Floating Circles */}
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <motion.div
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8"
              variants={fadeInUp}
            >
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" aria-hidden="true" />
              <span className="text-white/90 text-sm font-medium">A solução #1 em feedback para startups</span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight"
              variants={fadeInUp}
            >
              Colete Feedbacks em
              <span className="text-blue-300"> Minutos</span>,
              <br />
              Não em Dias
            </motion.h1>

            <motion.p
              className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto lg:mx-0"
              variants={fadeInUp}
            >
              Widget ultra-leve que se integra em segundos. Entenda seus usuários, 
              tome decisões baseadas em dados e melhore seu produto continuamente.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              variants={fadeInUp}
            >
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 py-6 text-lg rounded-xl shadow-2xl shadow-blue-900/30 transition-all hover:scale-105 hover:shadow-blue-900/40"
                >
                  Começar Grátis
                  <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-xl backdrop-blur-sm"
                >
                  Ver Demo
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="mt-12 flex flex-wrap items-center gap-6 justify-center lg:justify-start"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 text-white/80">
                <Shield className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Zap className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">Setup em 2 minutos</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <MessageSquare className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">10.000+ feedbacks coletados</span>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Demo Widget */}
          <motion.div
            className="relative"
            variants={fadeIn}
          >
            {/* Demo Card */}
            <motion.div
              className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl shadow-blue-900/30"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Mock Browser Window */}
              <div className="bg-gray-900/80 rounded-2xl overflow-hidden">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/80 border-b border-gray-700/50">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" aria-hidden="true" />
                    <div className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-700/50 rounded-md px-3 py-1 text-xs text-gray-400 text-center font-mono">
                      minhaapp.com/dashboard
                    </div>
                  </div>
                </div>
                
                {/* Mock Content */}
                <div className="p-8 min-h-[280px] relative">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-700/50 rounded w-3/4" aria-hidden="true" />
                    <div className="h-4 bg-gray-700/50 rounded w-1/2" aria-hidden="true" />
                    <div className="h-4 bg-gray-700/50 rounded w-5/6" aria-hidden="true" />
                    <div className="h-32 bg-gray-700/30 rounded-lg mt-6" aria-hidden="true" />
                  </div>

                  {/* Floating Widget Preview */}
                  <motion.div
                    className="absolute bottom-4 right-4 bg-white rounded-2xl shadow-2xl p-4 w-64"
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    role="img"
                    aria-label="Preview do widget de feedback TinyFeedback"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-5 h-5 text-blue-600" aria-hidden="true" />
                      <span className="text-sm font-semibold text-gray-900">Como foi sua experiência?</span>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.div
                          key={star}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1 + star * 0.1 }}
                        >
                          <Star
                            className={`w-6 h-6 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            aria-hidden="true"
                          />
                        </motion.div>
                      ))}
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 mb-3">
                      <div className="text-xs text-gray-500">Digite seu feedback...</div>
                    </div>
                    <button className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Enviar Feedback
                    </button>
                  </motion.div>
                </div>
              </div>

              {/* Floating Stats Card */}
              <motion.div
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 hidden sm:block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                aria-hidden="true"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">98%</div>
                    <div className="text-xs text-gray-500">Taxa de resposta</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Social Proof - Logos */}
        <motion.div
          className="mt-20 pt-12 border-t border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          <p className="text-center text-white/60 text-sm mb-8">Usado por equipes inovadoras</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
            {["StartupXYZ", "TechFlow", "InnovateCo", "CloudBase", "DevTeam"].map((company, index) => (
              <motion.div
                key={company}
                className="text-white font-semibold text-lg tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 + index * 0.1 }}
                aria-label={`Logo da empresa ${company}`}
              >
                {company}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
