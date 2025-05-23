const { ApperClient } = window.ApperSDK

class TaskService {
  constructor() {
    this.client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
    this.tableName = 'task'
    this.fields = [
      'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
      'title', 'description', 'dueDate', 'priority', 'status', 'category', 'estimatedHours',
      'position', 'createdAt', 'updatedAt', 'project'
    ]
    this.updateableFields = [
      'Name', 'Tags', 'Owner', 'title', 'description', 'dueDate', 'priority', 'status',
      'category', 'estimatedHours', 'position', 'createdAt', 'updatedAt', 'project'
    ]
  }

  async fetchTasks(filters = {}) {
    try {
      const params = {
        fields: this.fields,
        orderBy: [{ fieldName: 'position', SortType: 'ASC' }]
      }

      if (filters.where) {
        params.where = filters.where
      }

      if (filters.search) {
        params.where = [
          {
            fieldName: 'title',
            operator: 'Contains',
            values: [filters.search]
          }
        ]
      }

      if (filters.status && filters.status !== 'all') {
        const statusCondition = {
          fieldName: 'status',
          operator: 'ExactMatch',
          values: [filters.status]
        }
        params.where = params.where ? [...params.where, statusCondition] : [statusCondition]
      }

      if (filters.priority) {
        const priorityCondition = {
          fieldName: 'priority',
          operator: 'ExactMatch',
          values: [filters.priority]
        }
        params.where = params.where ? [...params.where, priorityCondition] : [priorityCondition]
      }

      const response = await this.client.fetchRecords(this.tableName, params)
      return response?.data || []
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  }

  async getTaskById(taskId) {
    try {
      const params = { fields: this.fields }
      const response = await this.client.getRecordById(this.tableName, taskId, params)
      return response?.data || null
    } catch (error) {
      console.error(`Error fetching task with ID ${taskId}:`, error)
      throw error
    }
  }

  async createTask(taskData) {
    try {
      // Filter to only include updateable fields
      const filteredData = {}
      this.updateableFields.forEach(field => {
        if (taskData[field] !== undefined) {
          filteredData[field] = taskData[field]
        }
      })

      // Ensure proper data formatting
      if (filteredData.dueDate && typeof filteredData.dueDate === 'string') {
        // Date format: YYYY-MM-DD
        filteredData.dueDate = filteredData.dueDate
      }

      if (filteredData.estimatedHours) {
        filteredData.estimatedHours = parseFloat(filteredData.estimatedHours)
      }

      if (filteredData.position !== undefined) {
        filteredData.position = parseInt(filteredData.position)
      }

      const params = {
        records: [filteredData]
      }

      const response = await this.client.createRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  async updateTask(taskId, taskData) {
    try {
      // Filter to only include updateable fields
      const filteredData = { Id: taskId }
      this.updateableFields.forEach(field => {
        if (taskData[field] !== undefined) {
          filteredData[field] = taskData[field]
        }
      })

      // Ensure proper data formatting
      if (filteredData.estimatedHours) {
        filteredData.estimatedHours = parseFloat(filteredData.estimatedHours)
      }

      if (filteredData.position !== undefined) {
        filteredData.position = parseInt(filteredData.position)
      }

      const params = {
        records: [filteredData]
      }

      const response = await this.client.updateRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  async deleteTask(taskId) {
    try {
      const params = { RecordIds: [taskId] }
      const response = await this.client.deleteRecord(this.tableName, params)
      
      if (response?.success) {
        return true
      } else {
        throw new Error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }
}

export default new TaskService()