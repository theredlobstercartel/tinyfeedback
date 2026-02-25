import Link from 'next/link'
import { MessageSquare, Github, Twitter, Linkedin } from 'lucide-react'

const currentYear = new Date().getFullYear()

const footerLinks = {
  produto: {
    title: 'Produto',
    links: [
      { label: 'Funcionalidades', href: '#features' },
      { label: 'Preços', href: '#pricing' },
      { label: 'API Docs', href: '/api-docs' },
      { label: 'Status', href: '#status' },
    ],
  },
  empresa: {
    title: 'Empresa',
    links: [
      { label: 'Sobre', href: '#about' },
      { label: 'Blog', href: '#blog' },
      { label: 'Carreiras', href: '#careers' },
      { label: 'Contato', href: '#contact' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacidade', href: '#privacy' },
      { label: 'Termos de Uso', href: '#terms' },
      { label: 'Cookies', href: '#cookies' },
      { label: 'LGPD', href: '#lgpd' },
    ],
  },
}

const socialLinks = [
  {
    label: 'Twitter',
    href: 'https://twitter.com/tinyfeedback',
    icon: Twitter,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/theredlobstercartel/tinyfeedback',
    icon: Github,
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/tinyfeedback',
    icon: Linkedin,
  },
]

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg transition-transform group-hover:scale-110">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TinyFeedback</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Widget de feedback ultra-leve para aplicações web. 
              Construa produtos melhores ouvindo seus usuários.
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {footerLinks.produto.title}
            </h3>
            <ul className="space-y-3">
              {footerLinks.produto.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {footerLinks.empresa.title}
            </h3>
            <ul className="space-y-3">
              {footerLinks.empresa.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {footerLinks.legal.title}
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} TinyFeedback. Todos os direitos reservados.
          </p>
          <p className="text-gray-500 text-sm">
            Feito com 💙 por{' '}
            <a 
              href="https://github.com/theredlobstercartel" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
            >
              The Red Lobster Cartel
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
