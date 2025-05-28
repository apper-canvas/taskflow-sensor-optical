import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ApperIcon from '../components/ApperIcon'
import ProjectService from '../services/ProjectService'
import TaskService from '../services/TaskService'
import { toast } from 'react-toastify'
import Chart from 'react-apexcharts'

const Analytics = () => {
  const [darkMode, setDarkMode] = useState(false)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch projects and tasks data
        const [projectsData, tasksData] = await Promise.all([
          ProjectService.getAllProjects(),
          TaskService.getAllTasks()
        ])
        
        setProjects(projectsData || [])
        setTasks(tasksData || [])
      } catch (err) {
        console.error('Error fetching analytics data:', err)
        setError('Failed to load analytics data')
        toast.error('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  // Calculate analytics data
  const getProjectStatusData = () => {
    if (!projects?.length) return { series: [], labels: [] }
    
    const statusCounts = projects.reduce((acc, project) => {
      const status = project.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    
    return {
      series: Object.values(statusCounts),
      labels: Object.keys(statusCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1))
    }
  }

  const getTaskCompletionTrend = () => {
    if (!tasks?.length) return { series: [], categories: [] }
    
    // Group tasks by month and status
    const monthlyData = tasks.reduce((acc, task) => {
      const date = new Date(task.createdAt || Date.now())
      const month = date.toLocaleDateString('en', { month: 'short', year: '2-digit' })
      
      if (!acc[month]) {
        acc[month] = { completed: 0, pending: 0, 'in-progress': 0 }
      }
      
      const status = task.status || 'pending'
      acc[month][status] = (acc[month][status] || 0) + 1
      
      return acc
    }, {})
    
    const months = Object.keys(monthlyData).sort()
    
    return {
      series: [
        {
          name: 'Completed',
          data: months.map(month => monthlyData[month]?.completed || 0)
        },
        {
          name: 'In Progress',
          data: months.map(month => monthlyData[month]?.['in-progress'] || 0)
        },
        {
          name: 'Pending',
          data: months.map(month => monthlyData[month]?.pending || 0)
        }
      ],
      categories: months
    }
  }

  const getTaskPriorityData = () => {
    if (!tasks?.length) return { series: [], labels: [] }
    
    const priorityCounts = tasks.reduce((acc, task) => {
      const priority = task.priority || 'low'
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {})
    
    return {
      series: Object.values(priorityCounts),
      labels: Object.keys(priorityCounts).map(p => p.charAt(0).toUpperCase() + p.slice(1))
    }
  }

  const getCategoryData = () => {
    if (!tasks?.length) return { series: [], categories: [] }
    
    const categoryCounts = tasks.reduce((acc, task) => {
      const category = task.category || 'Other'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})
    
    return {
      series: [{
        name: 'Tasks',
        data: Object.values(categoryCounts)
      }],
      categories: Object.keys(categoryCounts)
    }
  }

  // Chart options
  const pieChartOptions = {
    chart: {
      type: 'donut',
      toolbar: { show: false }
    },
    colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
    legend: {
      position: 'bottom',
      fontSize: '14px'
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return Math.round(val) + '%'
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  }

  const areaChartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#10b981', '#6366f1', '#f59e0b'],
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1
      }
    },
    xaxis: {
      categories: getTaskCompletionTrend().categories
    },
    yaxis: {
      title: {
        text: 'Number of Tasks'
      }
    },
    legend: {
      position: 'top'
    }
  }

  const barChartOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false }
    },
    colors: ['#6366f1'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false
      }
    },
    xaxis: {
      categories: getCategoryData().categories
    },
    yaxis: {
      title: {
        text: 'Number of Tasks'
      }
    }
  }

  const stats = [
    {
      icon: 'Briefcase',
      label: 'Total Projects',
      value: projects?.length || 0,
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: 'CheckSquare',
      label: 'Total Tasks',
      value: tasks?.length || 0,
      color: 'from-green-500 to-green-600'
    },
    {
      icon: 'Clock',
      label: 'Pending Tasks',
      value: tasks?.filter(t => t.status === 'pending')?.length || 0,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: 'TrendingUp',
      label: 'Completion Rate',
      value: tasks?.length ? Math.round((tasks?.filter(t => t.status === 'completed')?.length / tasks.length) * 100) + '%' : '0%',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <div className="bg-white/60 dark:bg-surface-800/60 backdrop-blur-lg rounded-2xl p-8 shadow-soft">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-surface-700 dark:text-surface-300 font-medium">Loading analytics...</span>
          </div>
        </div>
      </div>
    )
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
              <Link to="/" className="text-surface-700 dark:text-surface-300 hover:text-primary transition-colors font-medium">
                Home
              </Link>
              <Link to="/projects" className="text-surface-700 dark:text-surface-300 hover:text-primary transition-colors font-medium">
                Projects
              </Link>
              <span className="text-primary font-medium">
                Analytics
              </span>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-surface-600 dark:text-surface-400 text-lg">
            Track your productivity and project insights
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
          >
            <div className="flex items-center space-x-3">
              <ApperIcon name="AlertCircle" className="w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/60 dark:bg-surface-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-soft border border-white/20 dark:border-surface-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                  <ApperIcon name={stat.icon} className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-surface-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-surface-600 dark:text-surface-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/60 dark:bg-surface-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-soft border border-white/20 dark:border-surface-700/50"
          >
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-6">
              Project Status Distribution
            </h3>
            {getProjectStatusData().series.length > 0 ? (
              <Chart
                options={pieChartOptions}
                series={getProjectStatusData().series}
                labels={getProjectStatusData().labels}
                type="donut"
                height={300}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-surface-500 dark:text-surface-400">
                <div className="text-center">
                  <ApperIcon name="PieChart" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No project data available</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Task Priority Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/60 dark:bg-surface-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-soft border border-white/20 dark:border-surface-700/50"
          >
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-6">
              Task Priority Distribution
            </h3>
            {getTaskPriorityData().series.length > 0 ? (
              <Chart
                options={pieChartOptions}
                series={getTaskPriorityData().series}
                labels={getTaskPriorityData().labels}
                type="donut"
                height={300}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-surface-500 dark:text-surface-400">
                <div className="text-center">
                  <ApperIcon name="PieChart" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No task data available</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Task Completion Trend */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white/60 dark:bg-surface-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-soft border border-white/20 dark:border-surface-700/50 lg:col-span-2"
          >
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-6">
              Task Completion Trend
            </h3>
            {getTaskCompletionTrend().series.length > 0 ? (
              <Chart
                options={areaChartOptions}
                series={getTaskCompletionTrend().series}
                type="area"
                height={350}
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center text-surface-500 dark:text-surface-400">
                <div className="text-center">
                  <ApperIcon name="TrendingUp" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No trend data available</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Task Categories */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/60 dark:bg-surface-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-soft border border-white/20 dark:border-surface-700/50 lg:col-span-2"
          >
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-6">
              Tasks by Category
            </h3>
            {getCategoryData().series[0]?.data.length > 0 ? (
              <Chart
                options={barChartOptions}
                series={getCategoryData().series}
                type="bar"
                height={350}
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center text-surface-500 dark:text-surface-400">
                <div className="text-center">
                  <ApperIcon name="BarChart3" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No category data available</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Analytics