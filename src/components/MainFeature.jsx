import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { format, isToday, isTomorrow, isThisWeek, parseISO, addDays, startOfMonth, endOfMonth } from 'date-fns'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import ApperIcon from './ApperIcon'
import { useDropzone } from 'react-dropzone'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import TaskService from '../services/TaskService'
import AttachmentService from '../services/AttachmentService'
import CommentService from '../services/CommentService'
import ProjectService from '../services/ProjectService'

const localizer = momentLocalizer(moment)

const MainFeature = () => {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [filter, setFilter] = useState('all')
  const [currentView, setCurrentView] = useState('list')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load data on component mount
  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const tasksData = await TaskService.fetchTasks()
      setTasks(tasksData || [])
      setError(null)
    } catch (err) {
      console.error('Error loading tasks:', err)
      setError('Failed to load tasks')
      setTasks([])
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const projectsData = await ProjectService.fetchProjects()
      setProjects(projectsData || [])
    } catch (err) {
      console.error('Error loading projects:', err)
      toast.error('Failed to load projects')
      setProjects([])
    }
  }

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    category: '',
    project: '',
    estimatedHours: 1,
    attachments: [],
    comments: []
  })

  const priorities = ['low', 'medium', 'high']
  const statuses = ['pending', 'in-progress', 'completed']
  const categories = ['Design', 'Development', 'Marketing', 'Research', 'Planning']

  const handleCreateTask = async (e) => {
    e.preventDefault()
    
    if (!newTask.title.trim()) {
      toast.error('Task title is required!')
      return
    }

    try {
      setLoading(true)
      
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate,
        priority: newTask.priority,
        status: selectedTask ? selectedTask.status : 'pending',
        category: newTask.category,
        estimatedHours: newTask.estimatedHours,
        position: selectedTask ? selectedTask.position : tasks.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        project: newTask.project
      }

      let result
      if (selectedTask) {
        result = await TaskService.updateTask(selectedTask.Id, taskData)
        toast.success('Task updated successfully!')
      } else {
        result = await TaskService.createTask(taskData)
        toast.success('Task created successfully!')
      }

      // Reload tasks to get fresh data
      await loadTasks()
      
      // Reset form
      resetForm()
    } catch (err) {
      console.error('Error saving task:', err)
      toast.error(selectedTask ? 'Failed to update task' : 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewTask({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      category: '',
      project: '',
      estimatedHours: 1,
      attachments: [],
      comments: []
    })
    setIsFormOpen(false)
    setSelectedTask(null)
  }

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      setLoading(true)
      await TaskService.updateTask(taskId, { 
        status: newStatus, 
        updatedAt: new Date().toISOString() 
      })
      
      // Reload tasks to get fresh data
      await loadTasks()
      
      if (newStatus === 'completed') {
        toast.success('Task completed! 🎉')
      } else {
        toast.info(`Task marked as ${newStatus.replace('-', ' ')}`)
      }
    } catch (err) {
      console.error('Error updating task status:', err)
      toast.error('Failed to update task status')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setNewTask({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category,
      project: task.project || '',
      estimatedHours: task.estimatedHours || 1,
      attachments: task.attachments || [],
      comments: task.comments || []
    })
    setIsFormOpen(true)
  }

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      try {
        setLoading(true)
        await TaskService.deleteTask(taskId)
        await loadTasks()
        toast.success('Task deleted successfully!')
      } catch (err) {
        console.error('Error deleting task:', err)
        toast.error('Failed to delete task')
      } finally {
        setLoading(false)
      }
    }
  }

  // File attachment handlers
  // Drag and drop handlers
  const handleDragEnd = (result) => {
    if (!result.destination) {
      return
    }

    const { source, destination } = result
    
    if (source.index === destination.index) {
      return
    }

    const filteredTasks = getFilteredTasks().sort((a, b) => a.position - b.position)
    const reorderedTasks = Array.from(filteredTasks)
    const [reorderedItem] = reorderedTasks.splice(source.index, 1)
    reorderedTasks.splice(destination.index, 0, reorderedItem)

    // Update positions
    const updatedTasks = tasks.map(task => {
      const newIndex = reorderedTasks.findIndex(t => t.id === task.id)
      return newIndex !== -1 ? { ...task, position: newIndex } : task
    })

    // Update positions in database
    reorderedTasks.forEach(async (task, index) => {
      try {
        await TaskService.updateTask(task.Id, { position: index })
      } catch (err) {
        console.error('Error updating task position:', err)
      }
    })
  }

  const handleFileUpload = (acceptedFiles) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]

    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return false
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type ${file.type} is not supported.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    const newAttachments = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString()
    }))

    setNewTask(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newAttachments]
    }))

    toast.success(`${validFiles.length} file(s) attached successfully!`)
  }

  const handleRemoveAttachment = (attachmentId) => {
    setNewTask(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(att => att.id !== attachmentId) || []
    }))
    toast.info('Attachment removed')
  }

  // Comment handlers
  const handleAddComment = (taskId, comment, parentId = null) => {
    // Note: In a real implementation, this would use CommentService
    // For now, we'll keep the local state management
    try {
      if (!comment.trim()) {
        toast.error('Comment cannot be empty')
        return
      }

      const newCommentObj = {
        id: Date.now() + Math.random(),
        text: comment.trim(),
        author: 'Current User', // In real app, this would come from auth
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        createdAt: new Date().toISOString(),
        parentId,
        replies: []
      }

      setTasks(prev => prev.map(task => {
        if (task.Id === taskId) {
          const comments = task.comments || []
          if (parentId) {
            // Add as reply - keep existing logic for nested comments
            const updateReplies = (commentsList) => {
              return commentsList.map(comment => {
                if (comment.id === parentId) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), newCommentObj]
                  }
                }
                if (comment.replies?.length > 0) {
                  return {
                    ...comment,
                    replies: updateReplies(comment.replies)
                  }
                }
                return comment
              })
            }
            return {
              ...task,
              comments: updateReplies(comments)
            }
          } else {
            // Add as top-level comment
            return {
              ...task,
              comments: [...comments, newCommentObj]
            }
          }
        }
        return task
      }))

      toast.success('Comment added successfully!')
    } catch (err) {
      console.error('Error adding comment:', err)
      toast.error('Failed to add comment')
    }
  }

  const handleDeleteComment = (taskId, commentId) => {
    try {
      setTasks(prev => prev.map(task => {
        if (task.Id === taskId) {
        const removeComment = (commentsList) => {
          return commentsList.filter(comment => {
            if (comment.id === commentId) return false
            if (comment.replies?.length > 0) {
              comment.replies = removeComment(comment.replies)
            }
            return true
          })
        }
        return {
          ...task,
          comments: removeComment(task.comments || [])
        }
      }
      return task
      }))
      toast.success('Comment deleted')
    } catch (err) {
      console.error('Error deleting comment:', err)
      toast.error('Failed to delete comment')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return 'Image'
    if (type.includes('pdf')) return 'FileText'
    if (type.includes('word') || type.includes('document')) return 'FileText'
    if (type.includes('excel') || type.includes('spreadsheet')) return 'Table'
    return 'File'
  }

  const getTotalComments = (comments) => {
    if (!comments || comments.length === 0) return 0
    return comments.reduce((total, comment) => {
      return total + 1 + getTotalComments(comment.replies || [])
    }, 0)
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return format(date, 'MMM d, yyyy')
  }

  const getFilteredTasks = () => {
    let filtered = tasks

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(task => {
        switch (filter) {
          case 'pending':
            return task.status === 'pending'
          case 'in-progress':
            return task.status === 'in-progress'
          case 'completed':
            return task.status === 'completed'
          case 'today':
            return isToday(parseISO(task.dueDate))
          case 'upcoming':
            return new Date(task.dueDate) > new Date()
          default:
            return true
        }
      })
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered.sort((a, b) => a.position - b.position)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-surface-600 dark:text-surface-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'CheckCircle2'
      case 'in-progress': return 'Clock'
      case 'pending': return 'Circle'
      default: return 'Circle'
    }
  }

  const getDateLabel = (dateString) => {
    const date = parseISO(dateString)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isThisWeek(date)) return format(date, 'EEEE')
    return format(date, 'MMM d, yyyy')
  }

  // Calendar event conversion
  const getCalendarEvents = () => {
    return getFilteredTasks().map(task => ({
      id: task.Id,
      title: task.title,
      start: new Date(task.dueDate),
      end: new Date(task.dueDate),
      resource: task,
      className: `priority-${task.priority} status-${task.status}`
    }))
  }

  const handleSelectEvent = (event) => {
    setSelectedTask(event.resource)
    handleEditTask(event.resource)
  }

  const handleSelectSlot = ({ start }) => {
    setNewTask(prev => ({
      ...prev,
      dueDate: moment(start).format('YYYY-MM-DD')
    }))
    setIsFormOpen(true)
  }

  // Timeline component
  const FileUpload = () => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: handleFileUpload,
      accept: {
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'text/plain': ['.txt'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp']
      },
      multiple: true
    })

    return (
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
          File Attachments
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-surface-300 dark:border-surface-600 hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          <ApperIcon name="Upload" className="w-8 h-8 text-surface-400 mx-auto mb-2" />
          {isDragActive ? (
            <p className="text-surface-600 dark:text-surface-400">Drop files here...</p>
          ) : (
            <div>
              <p className="text-surface-600 dark:text-surface-400 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-surface-500">
                PDF, DOC, XLS, TXT, Images up to 10MB
              </p>
            </div>
          )}
        </div>

        {/* Display attached files */}
        {newTask.attachments && newTask.attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
              Attached Files ({newTask.attachments.length})
            </p>
            {newTask.attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <ApperIcon name={getFileIcon(file.type)} className="w-5 h-5 text-surface-500" />
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-surface-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(file.id)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <ApperIcon name="X" className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const CommentSection = ({ task }) => {
    const [localComment, setLocalComment] = useState('')
    const [localReplyingTo, setLocalReplyingTo] = useState(null)
    const [localReplyText, setLocalReplyText] = useState('')

    const renderComment = (comment, depth = 0) => (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-3' : 'mb-4'}`}>
        <div className="flex items-start space-x-3">
          <img
            src={comment.avatar}
            alt={comment.author}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="bg-surface-50 dark:bg-surface-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-surface-900 dark:text-white">
                  {comment.author}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-surface-500">
                    {getTimeAgo(comment.createdAt)}
                  </span>
                    onClick={() => handleDeleteComment(task.id, comment.id)}
                    onClick={() => handleDeleteComment(task.Id, comment.id)}
                  >
                    <ApperIcon name="Trash2" className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                {comment.text}
              </p>
            </div>
            <button
              onClick={() => {
                setLocalReplyingTo(localReplyingTo === comment.id ? null : comment.id)
                setLocalReplyText('')
              }}
              className="text-xs text-primary hover:text-primary-dark mt-1"
            >
              Reply
            </button>

            {localReplyingTo === comment.id && (
              <div className="mt-2 flex space-x-2">
                <textarea
                  value={localReplyText}
                  onChange={(e) => setLocalReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  rows={2}
                />
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => {
                      if (localReplyText.trim()) {
                        handleAddComment(task.Id, localReplyText, comment.id)
                        setLocalReplyText('')
                        setLocalReplyingTo(null)
                      }
                    }}
                    className="px-3 py-1 bg-primary text-white text-xs rounded"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setLocalReplyingTo(null)
                      setLocalReplyText('')
                    }}
                    className="px-3 py-1 bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-300 text-xs rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        </div>
      </div>
    )

    return (
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
          Comments ({getTotalComments(task.comments || [])})
        </label>
        
        {/* Add new comment */}
        <div className="mb-4">
          <div className="flex space-x-3">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
              alt="You"
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                value={localComment}
                onChange={(e) => setLocalComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                rows={3}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-surface-500">
                  {localComment.length}/500 characters
                </span>
                <button
                  onClick={() => {
                    if (localComment.trim()) {
                      handleAddComment(task.Id, localComment)
                      setLocalComment('')
                    }
                  }}
                  disabled={!localComment.trim() || localComment.length > 500}
                  className="px-4 py-2 bg-primary text-white text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {task.comments && task.comments.length > 0 ? (
            task.comments.map(comment => renderComment(comment))
          ) : (
            <p className="text-center text-surface-500 py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>
    )
  }

  const TaskTimeline = () => {
    const timelineTasks = getFilteredTasks().sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    const projectGroups = {}
    
    timelineTasks.forEach(task => {
      const project = task.project || 'Unassigned'
      if (!projectGroups[project]) {
        projectGroups[project] = []
      }
      projectGroups[project].push(task)
    })

    return (
      <div className="timeline-container">
        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-6">Project Timeline</h3>
        
        {Object.entries(projectGroups).map(([project, projectTasks]) => (
          <div key={project} className="mb-8">
            <h4 className="text-lg font-semibold text-primary mb-4 flex items-center">
              <ApperIcon name="Folder" className="w-5 h-5 mr-2" />
              {project}
            </h4>
            
            <div className="ml-4">
              {projectTasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className={`timeline-item status-${task.status} priority-${task.priority}`}
                >
                  <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 hover:shadow-card transition-all duration-200 cursor-pointer"
                       onClick={() => handleEditTask(task)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className={`font-semibold text-surface-900 dark:text-white mb-1 ${
                          task.status === 'completed' ? 'line-through opacity-60' : ''
                        }`}>
                          {task.title}
                        </h5>
                        <p className="text-surface-600 dark:text-surface-400 text-sm mb-2">
                          {task.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="flex items-center space-x-1">
                            <ApperIcon name="Calendar" className="w-3 h-3" />
                            <span>{getDateLabel(task.dueDate)}</span>
                          </span>
                          <span className={`flex items-center space-x-1 ${getPriorityColor(task.priority)}`}>
                            <ApperIcon name="Flag" className="w-3 h-3" />
                            <span className="capitalize">{task.priority}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <ApperIcon name="Clock" className="w-3 h-3" />
                            <span>{task.estimatedHours}h</span>
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <ApperIcon 
                          name={getStatusIcon(task.status)}
                          className={`w-5 h-5 ${
                            task.status === 'completed' ? 'text-green-500' :
                            task.status === 'in-progress' ? 'text-blue-500' : 'text-surface-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {Object.keys(projectGroups).length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ApperIcon name="Timeline" className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
              No timeline data
            </h3>
            <p className="text-surface-600 dark:text-surface-400">
              Create tasks with due dates to see your project timeline
            </p>
          </div>
        )}
      </div>
    )
  }

  // Calendar component
  const TaskCalendar = () => (
    <div className="calendar-container p-6">
      <Calendar
        localizer={localizer}
        events={getCalendarEvents()}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={(event) => ({
          className: event.className
        })}
        views={['month', 'week', 'day']}
        defaultView="month"
        popup
        showMultiDayTimes
        components={{
          event: ({ event }) => (
            <div className="flex items-center justify-between w-full">
              <span className="font-medium truncate">{event.title}</span>
              <ApperIcon 
                name={getStatusIcon(event.resource.status)}
                className="w-3 h-3 ml-1 flex-shrink-0"
              />
            </div>
          )
        }}
      />
    </div>
  )

  // View switcher component
  const ViewSwitcher = () => (
    <div className="view-switcher">
      <button
        onClick={() => setCurrentView('list')}
        className={currentView === 'list' ? 'active' : ''}
      >
        <ApperIcon name="List" className="w-4 h-4 mr-2" />
        List
      </button>
      <button
        onClick={() => setCurrentView('calendar')}
        className={currentView === 'calendar' ? 'active' : ''}
      >
        <ApperIcon name="Calendar" className="w-4 h-4 mr-2" />
        Calendar
      </button>
      <button
        onClick={() => setCurrentView('timeline')}
        className={currentView === 'timeline' ? 'active' : ''}
      >
        <ApperIcon name="Clock" className="w-4 h-4 mr-2" />
        Timeline
      </button>
    </div>
  )

  return (
    <div className="p-6 md:p-8 lg:p-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 md:mb-10">
        <div className="mb-6 lg:mb-0">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-surface-900 dark:text-white mb-2">
            Task Dashboard
          </h2>
          <p className="text-surface-600 dark:text-surface-400 text-base md:text-lg">
            Manage your tasks efficiently and boost your productivity
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <ViewSwitcher />
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <motion.button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl shadow-soft hover:shadow-card transition-all duration-200 w-full lg:w-auto"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ApperIcon name="Plus" className="w-5 h-5 mr-2" />
          Create Task
        </motion.button>
      </div>

      {/* Filters and Search */}
      {(currentView === 'list' || currentView === 'timeline') && (
        <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <ApperIcon name="Search" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Tasks', icon: 'List' },
            { id: 'pending', label: 'Pending', icon: 'Circle' },
            { id: 'in-progress', label: 'In Progress', icon: 'Clock' },
            { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
            { id: 'today', label: 'Due Today', icon: 'Calendar' },
            { id: 'upcoming', label: 'Upcoming', icon: 'CalendarDays' }
          ].map((filterOption) => (
            <motion.button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`flex items-center px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base ${
                filter === filterOption.id
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ApperIcon name={filterOption.icon} className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">{filterOption.label}</span>
              <span className="sm:hidden">{filterOption.label.split(' ')[0]}</span>
            </motion.button>
          ))}
        </div>
        </div>
      )}

      {/* Content based on current view */}
      {currentView === 'calendar' && <TaskCalendar />}
      {currentView === 'timeline' && <TaskTimeline />}
      
      {/* Task List - only show in list view */}
      {currentView === 'list' && (
        <div className="space-y-4">
        {(() => {
          const filteredTasks = getFilteredTasks()
          return (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="task-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12 md:py-16"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ApperIcon name="ClipboardList" className="w-8 h-8 md:w-10 md:h-10 text-surface-400" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-surface-900 dark:text-white mb-2">
                No tasks found
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                {searchTerm ? "Try adjusting your search terms" : "Create your first task to get started"}
              </p>
            </motion.div>
          ) : (
            filteredTasks.map((task, index) => (
              <Draggable key={task.Id} draggableId={task.Id.toString()} index={index}>
                {(provided, snapshot) => (
                  <motion.div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white dark:bg-surface-800 rounded-2xl p-4 md:p-6 shadow-soft border border-surface-200 dark:border-surface-700 hover:shadow-card transition-all duration-200 ${
                      task.priority === 'high' ? 'priority-high' : 
                      task.priority === 'medium' ? 'priority-medium' : 'priority-low'
                    } ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div
                          {...provided.dragHandleProps}
                          className="mt-1 p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded cursor-grab active:cursor-grabbing"
                        >
                          <ApperIcon name="GripVertical" className="w-5 h-5 text-surface-400" />
                        </div>
                        <button
                          onClick={() => {
                            const nextStatus = task.status === 'pending' ? 'in-progress' :
                                             task.status === 'in-progress' ? 'completed' : 'pending'
                            handleUpdateTaskStatus(task.Id, nextStatus)
                          }}
                          className="mt-1 flex-shrink-0"
                        >
                          <ApperIcon 
                            name={getStatusIcon(task.status)}
                            className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${
                              task.status === 'completed' ? 'text-green-500' :
                              task.status === 'in-progress' ? 'text-yellow-500' : 'text-surface-400'
                            }`}
                          />
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-lg md:text-xl font-semibold mb-2 ${
                            task.status === 'completed' ? 'line-through text-surface-500' : 'text-surface-900 dark:text-white'
                          }`}>
                            {task.title}
                          </h3>
                          
                          {task.description && (
                            <p className="text-surface-600 dark:text-surface-400 mb-3 text-sm md:text-base leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center space-x-1">
                            <ApperIcon name="Calendar" className="w-4 h-4 text-surface-400" />
                            <span className="text-surface-600 dark:text-surface-400">
                              {getDateLabel(task.dueDate)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <ApperIcon name="Flag" className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
                            <span className={`capitalize ${getPriorityColor(task.priority)} font-medium`}>
                              {task.priority}
                            </span>
                          </div>
                          
                          {task.category && (
                            <div className="flex items-center space-x-1">
                              <ApperIcon name="Tag" className="w-4 h-4 text-surface-400" />
                              <span className="text-surface-600 dark:text-surface-400">
                                {task.category}
                              </span>
                            </div>
                          )}
                        
                        {/* Attachments and Comments indicators */}
                        <div className="flex items-center space-x-3 mt-2">
                        <div className="flex items-center space-x-3">
                          {task.attachments && task.attachments.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <ApperIcon name="Paperclip" className="w-4 h-4 text-surface-400" />
                              <span className="text-surface-600 dark:text-surface-400 text-xs">
                                {task.attachments.length}
                              </span>
                            </div>
                          )}
                          {task.comments && getTotalComments(task.comments) > 0 && (
                            <div className="flex items-center space-x-1">
                              <ApperIcon name="MessageCircle" className="w-4 h-4 text-surface-400" />
                              <span className="text-surface-600 dark:text-surface-400 text-xs">
                                {getTotalComments(task.comments)}
                              </span>
                            </div>
                          )}
                        </div>
                        </div>
                        </div>
                        </div>
                        </div>
                  
                      <div className="flex items-center space-x-2 sm:ml-4">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <ApperIcon name="Edit" className="w-4 h-4" />
                        </button>
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.Id, e.target.value)}
                          className="px-3 py-1 bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          {statuses.map(status => (
                            <option key={status} value={status}>
                              {status.replace('-', ' ')}
                            </option>
                          ))}
                        </select>
                    
                        <button
                          onClick={() => handleDeleteTask(task.Id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <ApperIcon name="Trash2" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </Draggable>
            ))
          )}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          );
        })()}
        </div>
      )}
      
      {/* Create/Edit Task Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setIsFormOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-surface-800 rounded-2xl shadow-soft max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white">
                    {selectedTask ? 'Edit Task' : 'Create New Task'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsFormOpen(false)
                      setSelectedTask(null)
                      setNewTask({
                        title: '',
                        description: '',
                        dueDate: '',
                        priority: 'medium',
                        category: '',
                        project: '',
                        estimatedHours: 1,
                        attachments: [],
                        comments: [],
                      })
                    }}
                    className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                  >
                    <ApperIcon name="X" className="w-5 h-5 text-surface-500" />
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter task title..."
                      className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter task description..."
                      rows={3}
                      className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      >
                        {priorities.map(priority => (
                          <option key={priority} value={priority}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Project
                      </label>
                      <select
                        value={newTask.project}
                        onChange={(e) => setNewTask(prev => ({ ...prev, project: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      >
                        <option value="">Select project...</option>
                        {projects.map(project => (
                          <option key={project} value={project}>
                            {project.Name || project}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={newTask.estimatedHours}
                        onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) }))}
                        className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <FileUpload />
                  </div>

                  {selectedTask && (
                    <CommentSection task={{ ...selectedTask, comments: tasks.find(t => t.Id === selectedTask.Id)?.comments || [] }} />
                  )}

                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Category
                    </label>
                    <select
                      value={newTask.category}
                      onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    >
                      <option value="">Select category...</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>


                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false)
                        setSelectedTask(null)
                        setNewTask({
                          title: '', description: '', dueDate: '', priority: 'medium', 
                          category: '', project: '', estimatedHours: 1,
                          comments: []
                          position: tasks.length
                        })
                      }}
                      className="px-6 py-3 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-semibold rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl shadow-soft hover:shadow-card transition-all duration-200"
                    >
                      {selectedTask ? 'Update Task' : 'Create Task'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MainFeature