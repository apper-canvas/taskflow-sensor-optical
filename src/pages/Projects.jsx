import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { toast } from 'react-toastify'
import ApperIcon from '../components/ApperIcon'
import ProjectService from '../services/ProjectService'
import ProjectTeamMemberService from '../services/ProjectTeamMemberService'
import ProjectTagService from '../services/ProjectTagService'

const Projects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [view, setView] = useState('grid')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    progress: 0,
    startDate: '',
    endDate: '',
    team: [],
    tasks: 0,
    completedTasks: 0,
    budget: 0,
    spent: 0,
    category: 'development',
    tags: []
  })

  // Load projects on component mount
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const projectsData = await ProjectService.fetchProjects()
      setProjects(projectsData || [])
      setError(null)
    } catch (err) {
      console.error('Error loading projects:', err)
      setError('Failed to load projects')
      toast.error('Failed to load projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: 'planning', label: 'Planning', color: 'bg-blue-500' },
    { value: 'active', label: 'Active', color: 'bg-green-500' },
    { value: 'on-hold', label: 'On Hold', color: 'bg-yellow-500' },
    { value: 'completed', label: 'Completed', color: 'bg-gray-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ]

  const categoryOptions = [
    { value: 'development', label: 'Development' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'research', label: 'Research' },
    { value: 'testing', label: 'Testing' }
  ]

  // Filter and sort projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = (project.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    const matchesPriority = filterPriority === 'all' || project.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  }).sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]
    
    if (sortBy === 'progress' || sortBy === 'budget' || sortBy === 'spent') {
      aValue = Number(aValue)
      bValue = Number(bValue)
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleCreateProject = async () => {
    try {
      if (!newProject.name.trim()) {
        toast.error('Project name is required')
        return
      }
      
      if (!newProject.description.trim()) {
        toast.error('Project description is required')
        return
      }

      if (!newProject.startDate || !newProject.endDate) {
        toast.error('Start date and end date are required')
        return
      }

      if (new Date(newProject.startDate) >= new Date(newProject.endDate)) {
        toast.error('End date must be after start date')
        return
      }

      setLoading(true)
      
      const projectData = {
        Name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        priority: newProject.priority,
        progress: newProject.progress,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
        budget: newProject.budget,
        spent: newProject.spent,
        category: newProject.category
      }

      await ProjectService.createProject(projectData)
      
      // Handle team members and tags separately if needed
      // This would require additional API calls to ProjectTeamMemberService and ProjectTagService
      
      await loadProjects()
      
      setNewProject({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        progress: 0,
        startDate: '',
        endDate: '',
        team: [],
        tasks: 0,
        completedTasks: 0,
        budget: 0,
        spent: 0,
        category: 'development',
        tags: []
      })
      setShowCreateModal(false)
      toast.success('Project created successfully!')
    } catch (err) {
      console.error('Error creating project:', err)
      toast.error('Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProject = async () => {
    try {
      if (!selectedProject.Name?.trim()) {
        toast.error('Project name is required')
        return
      }
      
      if (!selectedProject.description?.trim()) {
        toast.error('Project description is required')
        return
      }

      if (!selectedProject.startDate || !selectedProject.endDate) {
        toast.error('Start date and end date are required')
        return
      }

      if (new Date(selectedProject.startDate) >= new Date(selectedProject.endDate)) {
        toast.error('End date must be after start date')
        return
      }

      setLoading(true)
      
      const projectData = {
        Name: selectedProject.Name,
        description: selectedProject.description,
        status: selectedProject.status,
        priority: selectedProject.priority,
        progress: selectedProject.progress,
        startDate: selectedProject.startDate,
        endDate: selectedProject.endDate,
        budget: selectedProject.budget,
        spent: selectedProject.spent,
        category: selectedProject.category
      }

      await ProjectService.updateProject(selectedProject.Id, projectData)
      await loadProjects()
      
      setSelectedProject(null)
      setShowEditModal(false)
      toast.success('Project updated successfully!')
    } catch (err) {
      console.error('Error updating project:', err)
      toast.error('Failed to update project')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        setLoading(true)
        await ProjectService.deleteProject(projectId)
        await loadProjects()
        toast.success('Project deleted successfully!')
      } catch (err) {
        console.error('Error deleting project:', err)
        toast.error('Failed to delete project')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(filteredProjects)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update the original projects array locally first for immediate feedback
    setProjects(prev => {
      const newProjects = [...prev]
      const sourceProject = prev.find(p => p.Id === reorderedItem.Id)
      const sourceIndex = prev.indexOf(sourceProject)
      newProjects.splice(sourceIndex, 1)
      newProjects.splice(result.destination.index, 0, sourceProject)
      return newProjects
    })
    
    toast.info('Project order updated')
  }

  const addTeamMember = (isEdit = false) => {
    const target = isEdit ? selectedProject : newProject
    const setter = isEdit ? setSelectedProject : setNewProject
    
    setter(prev => ({
      ...prev,
      team: [...prev.team, '']
    }))
  }

  const removeTeamMember = (index, isEdit = false) => {
    const target = isEdit ? selectedProject : newProject
    const setter = isEdit ? setSelectedProject : setNewProject
    
    setter(prev => ({
      ...prev,
      team: prev.team.filter((_, i) => i !== index)
    }))
  }

  const updateTeamMember = (index, value, isEdit = false) => {
    const target = isEdit ? selectedProject : newProject
    const setter = isEdit ? setSelectedProject : setNewProject
    
    setter(prev => ({
      ...prev,
      team: prev.team.map((member, i) => i === index ? value : member)
    }))
  }

  const addTag = (isEdit = false) => {
    const target = isEdit ? selectedProject : newProject
    const setter = isEdit ? setSelectedProject : setNewProject
    
    setter(prev => ({
      ...prev,
      tags: [...prev.tags, '']
    }))
  }

  const removeTag = (index, isEdit = false) => {
    const target = isEdit ? selectedProject : newProject
    const setter = isEdit ? setSelectedProject : setNewProject
    
    setter(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }))
  }

  const updateTag = (index, value, isEdit = false) => {
    const target = isEdit ? selectedProject : newProject
    const setter = isEdit ? setSelectedProject : setNewProject
    
    setter(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => i === index ? value : tag)
    }))
  }

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption ? statusOption.color : 'bg-gray-500'
  }

  const getPriorityColor = (priority) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority)
    return priorityOption ? priorityOption.color : 'text-gray-600'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
            Projects
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Manage and track your projects effectively
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* Search and Create */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <ApperIcon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-surface-900 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <ApperIcon name="plus" className="w-5 h-5" />
              Create Project
            </button>
          </div>

          {/* Filters and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm"
              >
                <option value="all">All Status</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm"
              >
                <option value="all">All Priority</option>
                {priorityOptions.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="progress">Sort by Progress</option>
                <option value="startDate">Sort by Start Date</option>
                <option value="endDate">Sort by End Date</option>
                <option value="budget">Sort by Budget</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                <ApperIcon name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} className="w-4 h-4" />
              </button>
            </div>

            {/* View Toggle */}
            <div className="view-switcher">
              <button
                onClick={() => setView('grid')}
                className={view === 'grid' ? 'active' : ''}
              >
                <ApperIcon name="grid-3x3" className="w-4 h-4 mr-2" />
                Grid
              </button>
              <button
                onClick={() => setView('list')}
                className={view === 'list' ? 'active' : ''}
              >
                <ApperIcon name="list" className="w-4 h-4 mr-2" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Projects Display */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="projects">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
              >
                {filteredProjects.map((project, index) => (
                  <Draggable key={project.Id} draggableId={project.Id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-white dark:bg-surface-800 rounded-2xl shadow-soft border border-surface-200 dark:border-surface-700 p-6 hover:shadow-card transition-all duration-200 ${snapshot.isDragging ? 'rotate-2 scale-105' : ''}`}
                      >
                        {/* Project Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                              {project.Name}
                            </h3>
                            <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                              {project.description}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                setSelectedProject(project)
                                setShowViewModal(true)
                              }}
                              className="p-2 text-surface-600 dark:text-surface-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <ApperIcon name="eye" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProject(project)
                                setShowEditModal(true)
                              }}
                              className="p-2 text-surface-600 dark:text-surface-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <ApperIcon name="edit" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.Id)}
                              className="p-2 text-surface-600 dark:text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <ApperIcon name="trash-2" className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Project Status and Priority */}
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(project.status)}`}>
                            {statusOptions.find(s => s.value === project.status)?.label}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                            {priorityOptions.find(p => p.value === project.priority)?.label} Priority
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-surface-900 dark:text-white">Progress</span>
                            <span className="text-sm text-surface-600 dark:text-surface-400">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Project Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-surface-600 dark:text-surface-400 mb-1">Progress</div>
                            <div className="text-sm font-medium text-surface-900 dark:text-white">
                              {project.progress}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-surface-600 dark:text-surface-400 mb-1">Budget</div>
                            <div className="text-sm font-medium text-surface-900 dark:text-white">
                              {formatCurrency(project.spent || 0)}/{formatCurrency(project.budget || 0)}
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center justify-between text-xs text-surface-600 dark:text-surface-400 mb-4">
                          <span>{formatDate(project.startDate)}</span>
                          <ApperIcon name="arrow-right" className="w-3 h-3" />
                          <span>{formatDate(project.endDate)}</span>
                        </div>

                        {/* Team */}
                        <div className="flex items-center gap-2">
                          <ApperIcon name="users" className="w-4 h-4 text-surface-600 dark:text-surface-400" />
                          <span className="text-sm text-surface-600 dark:text-surface-400">
                            {(project.team?.length || 0)} team member{(project.team?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <ApperIcon name="folder" className="w-16 h-16 mx-auto text-surface-400 mb-4" />
            <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-2">No projects found</h3>
            <p className="text-surface-600 dark:text-surface-400 mb-4">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first project'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
              >
                Create Project
              </button>
            )}
          </div>
        )}

        {/* Create Project Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Create New Project</h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                    >
                      <ApperIcon name="x" className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Basic Information</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Project Name *
                        </label>
                        <input
                          type="text"
                          value={newProject.name}
                          onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-surface-900 dark:text-white"
                          placeholder="Enter project name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Description *
                        </label>
                        <textarea
                          value={newProject.description}
                          onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-surface-900 dark:text-white"
                          placeholder="Enter project description"
                          rows="3"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Status
                          </label>
                          <select
                            value={newProject.status}
                            onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-surface-900 dark:text-white"
                          >
                            {statusOptions.map(status => (
                              <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Priority
                          </label>
                          <select
                            value={newProject.priority}
                            onChange={(e) => setNewProject(prev => ({ ...prev, priority: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-surface-900 dark:text-white"
                          >
                            {priorityOptions.map(priority => (
                              <option key={priority.value} value={priority.value}>{priority.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Category
                          </label>
                          <select
                            value={newProject.category}
                            onChange={(e) => setNewProject(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-surface-900 dark:text-white"
                          >
                            {categoryOptions.map(category => (
                              <option key={category.value} value={category.value}>{category.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Dates and Budget */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Timeline & Budget</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={newProject.startDate}
                            onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-surface-900 dark:text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            End Date *
                          </label>
                          <input
                            type="date"
                            value={newProject.endDate}
                            onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-surface-900 dark:text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Budget ($)
                          </label>
                          <input
                            type="number"
                            value={newProject.budget}
                            onChange={(e) => setNewProject(prev => ({ ...prev, budget: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-surface-900 dark:text-white"
                            placeholder="0"
                            min="0"
                          />
                        </div>
        
                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Progress (%)
                          </label>
                          <input
                            type="number"
                            value={newProject.progress}
                            onChange={(e) => setNewProject(prev => ({ ...prev, progress: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-surface-900 dark:text-white"
                            placeholder="0"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Team Members */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Team Members</h3>
                        <button
                          type="button"
                          onClick={() => addTeamMember(false)}
                          className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          Add Member
                        </button>
                      </div>
                      
                      {newProject.team.map((member, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={member}
                            onChange={(e) => updateTeamMember(index, e.target.value, false)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-surface-900 dark:text-white"
                            placeholder="Team member name"
                          />
                          <button
                            type="button"
                            onClick={() => removeTeamMember(index, false)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <ApperIcon name="trash-2" className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 px-6 py-2 bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-white rounded-xl hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                      >
                        Create Project
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-surface-900 dark:text-white">{projects.length}</div>
            <div className="text-sm text-surface-600 dark:text-surface-400">Total Projects</div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{projects.filter(p => p.status === 'active').length}</div>
            <div className="text-sm text-surface-600 dark:text-surface-400">Active Projects</div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{projects.filter(p => p.status === 'completed').length}</div>
            <div className="text-sm text-surface-600 dark:text-surface-400">Completed</div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length || 0)}%
            </div>
            <div className="text-sm text-surface-600 dark:text-surface-400">Avg Progress</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Projects