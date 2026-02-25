'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  BarChart3,
  MessageSquare,
  Bug,
  LayoutDashboard,
  Palette,
  Code,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'NPS',
    description:
      'Meça a satisfação dos seus usuários com pesquisas NPS simples e rápidas. Obtenha insights valiosos sobre a lealdade do cliente.',
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'Sugestões',
    description:
      'Receba ideias e sugestões diretamente dos seus usuários. Descubra o que eles realmente querem para melhorar seu produto.',
  },
  {
    icon: <Bug className="h-6 w-6" />,
    title: 'Bugs',
    description:
      'Capture relatórios de bugs de forma organizada. Facilite a comunicação entre usuários e equipe de desenvolvimento.',
  },
  {
    icon: <LayoutDashboard className="h-6 w-6" />,
    title: 'Dashboard',
    description:
      'Visualize todos os feedbacks em um painel intuitivo. Acompanhe métricas, tendências e tome decisões baseadas em dados.',
  },
  {
    icon: <Palette className="h-6 w-6" />,
    title: 'Widget Customizável',
    description:
      'Adapte o widget à identidade visual da sua marca. Cores, posição e comportamento totalmente configuráveis.',
  },
  {
    icon: <Code className="h-6 w-6" />,
    title: 'Fácil Integração',
    description:
      'Integre em minutos com apenas algumas linhas de código. Funciona com qualquer framework ou tecnologia web.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      ref={ref}
      className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Tudo que você precisa para{' '}
            <span className="text-blue-600 dark:text-blue-400">
              ouvir seus usuários
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Uma suite completa de ferramentas para coletar, organizar e
            analisar feedback dos seus usuários em um só lugar.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 transition-shadow duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
