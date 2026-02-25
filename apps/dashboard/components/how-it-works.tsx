'use client'

import React, { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { UserPlus, Settings, Copy, Inbox, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Step {
  number: number
  icon: React.ReactNode
  title: string
  description: string
  codeSnippet?: string
}

const steps: Step[] = [
  {
    number: 1,
    icon: <UserPlus className="h-6 w-6" />,
    title: 'Crie sua conta',
    description: 'Cadastre-se gratuitamente em menos de 1 minuto. Sem cartão de crédito, sem compromisso.',
  },
  {
    number: 2,
    icon: <Settings className="h-6 w-6" />,
    title: 'Configure seu widget',
    description: 'Personalize cores, posição e comportamento do widget para combinar com sua marca.',
  },
  {
    number: 3,
    icon: <Copy className="h-6 w-6" />,
    title: 'Copie e cole o código',
    description: 'Adicione apenas duas linhas de código no seu site. Funciona com qualquer tecnologia.',
    codeSnippet: `<script src="https://widget.tinyfeedback.com/v1.js"></script>
<script>
  TinyFeedback.init({ projectId: 'seu-id' });
</script>`,
  },
  {
    number: 4,
    icon: <Inbox className="h-6 w-6" />,
    title: 'Receba feedbacks',
    description: 'Comece a receber sugestões, NPS e relatórios de bugs em tempo real no dashboard.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
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

const connectorVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const connectorVariantsVertical = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

function CodeSnippetWithCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="relative mt-4 rounded-lg bg-gray-900 p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80 text-xs font-medium transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <pre className="text-xs sm:text-sm text-gray-300 font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      ref={ref}
      className="w-full py-16 md:py-24 lg:py-32 bg-white dark:bg-gray-950"
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
            Como funciona o{' '}
            <span className="text-blue-600 dark:text-blue-400">
              TinyFeedback
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Comece a coletar feedbacks em 4 passos simples. 
            Integração em minutos, resultados imediatos.
          </p>
        </motion.div>

        {/* Steps Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="relative"
        >
          {/* Desktop: Horizontal Layout with Connectors */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  variants={itemVariants}
                  className="relative"
                >
                  {/* Connector Line (except for last item) */}
                  {index < steps.length - 1 && (
                    <motion.div
                      variants={connectorVariants}
                      initial="hidden"
                      animate={isInView ? 'visible' : 'hidden'}
                      transition={{ delay: 0.3 + index * 0.2 }}
                      className="absolute top-12 left-[60%] right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-300 origin-left"
                      style={{ width: '80%' }}
                    />
                  )}

                  {/* Step Card */}
                  <div className="relative z-10 bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 h-full">
                    {/* Step Number Badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/25">
                        {step.number}
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        {step.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Code Snippet for Step 3 */}
                    {step.codeSnippet && (
                      <CodeSnippetWithCopy code={step.codeSnippet} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tablet: 2x2 Grid */}
          <div className="hidden md:grid lg:hidden grid-cols-2 gap-6">
            {steps.map((step) => (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/25">
                    {step.number}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {step.description}
                </p>
                {step.codeSnippet && (
                  <CodeSnippetWithCopy code={step.codeSnippet} />
                )}
              </motion.div>
            ))}
          </div>

          {/* Mobile: Vertical Layout with Connectors */}
          <div className="md:hidden space-y-0">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="relative"
              >
                {/* Vertical Connector Line */}
                {index < steps.length - 1 && (
                  <motion.div
                    variants={connectorVariantsVertical}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    transition={{ delay: 0.3 + index * 0.2 }}
                    className="absolute left-6 top-16 w-0.5 h-12 bg-gradient-to-b from-blue-500 to-blue-300 origin-top"
                  />
                )}

                <div className="flex gap-4 pb-8">
                  {/* Left: Icon & Number */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/25 shrink-0">
                      {step.number}
                    </div>
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        {step.icon}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                    {step.codeSnippet && (
                      <CodeSnippetWithCopy code={step.codeSnippet} />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 md:mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
            <div className="text-center sm:text-left">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Pronto para começar?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Crie sua conta gratuita e instale em menos de 5 minutos.
              </p>
            </div>
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-5 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-blue-500/40 whitespace-nowrap"
              >
                Começar Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
