import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import MainFeature from '../components/MainFeature'
import ApperIcon from '../components/ApperIcon'

const Home = () => {
  const [darkMode, setDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Header */}
      <header className="relative z-10 bg-white/80 dark:bg-surface-900/80 backdrop-blur-lg border-b border-surface-200/50 dark:border-surface-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center shadow-soft">
                <ApperIcon name="CheckSquare" className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                TaskFlow
              </span>
            </motion.div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#tasks" className="text-surface-700 dark:text-surface-300 hover:text-primary transition-colors font-medium">
                Tasks
              </a>
              <Link to="/projects" className="text-surface-700 dark:text-surface-300 hover:text-primary transition-colors font-medium">
                Projects
              </Link>
              <a href="#analytics" className="text-surface-700 dark:text-surface-300 hover:text-primary transition-colors font-medium">
                Analytics
              </a>
            </nav>

            {/* Dark Mode Toggle */}
            <motion.button
              onClick={toggleDarkMode}
              className="p-2 md:p-3 neu-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ApperIcon 
                name={darkMode ? "Sun" : "Moon"} 
                className="w-5 h-5 md:w-6 md:h-6 text-surface-700 dark:text-surface-300" 
              />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16 lg:mb-20">
            <motion.h1 
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-surface-900 dark:text-white mb-4 md:mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Organize Your Tasks,
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Amplify Your Productivity
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl lg:text-2xl text-surface-600 dark:text-surface-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Transform chaos into clarity with TaskFlow's intelligent task management. 
              Create, prioritize, and track your way to success.
            </motion.p>
          </div>

          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {[
              { icon: "Target", label: "Tasks Completed", value: "2,847" },
              { icon: "TrendingUp", label: "Productivity Boost", value: "340%" },
              { icon: "Users", label: "Active Users", value: "12k+" }
            ].map((stat, index) => (
              <div key={index} className="bg-white/60 dark:bg-surface-800/60 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-soft border border-white/20 dark:border-surface-700/50">
                <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-primary to-accent rounded-xl mb-4 mx-auto">
                  <ApperIcon name={stat.icon} className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-2 text-center">
                  {stat.value}
                </div>
                <div className="text-surface-600 dark:text-surface-400 text-center font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Feature Section */}
      <section className="relative py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl rounded-3xl shadow-soft border border-white/30 dark:border-surface-700/30 overflow-hidden"
          >
            <MainFeature />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-surface-900 dark:bg-surface-950 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
                <ApperIcon name="CheckSquare" className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TaskFlow</span>
            </div>
            
            <div className="flex items-center space-x-6 text-surface-400">
              <span className="text-sm md:text-base">© 2024 TaskFlow. Built for productivity.</span>
              <div className="flex items-center space-x-4">
                <ApperIcon name="Github" className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
                <ApperIcon name="Twitter" className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
                <ApperIcon name="Mail" className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home