import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ApperIcon from '../components/ApperIcon'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 dark:bg-surface-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-soft border border-white/30 dark:border-surface-700/30"
        >
          {/* 404 Icon */}
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ApperIcon name="AlertTriangle" className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </div>

          {/* 404 Text */}
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            404
          </h1>

          <h2 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-4">
            Page Not Found
          </h2>

          <p className="text-surface-600 dark:text-surface-400 mb-8 leading-relaxed">
            Oops! The page you're looking for seems to have wandered off. 
            Let's get you back to organizing your tasks.
          </p>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl shadow-soft hover:shadow-card transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ApperIcon name="Home" className="w-5 h-5 mr-2" />
              Back to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-semibold rounded-xl shadow-soft hover:shadow-card transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ApperIcon name="ArrowLeft" className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="mt-8 flex items-center justify-center space-x-2 text-surface-400">
            <ApperIcon name="CheckSquare" className="w-4 h-4" />
            <span className="text-sm">TaskFlow</span>
          </div>
        </motion.div>

        {/* Background decoration */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-accent/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.3, 0.6]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  )
}

export default NotFound