const { ApperClient } = window.ApperSDK

class ProjectService {
  constructor() {
    this.client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
    this.tableName = 'project'
    this.fields = [
      'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
      'description', 'status', 'priority', 'progress', 'startDate', 'endDate', 'budget',
      'spent', 'category'
    ]
    this.updateableFields = [
      'Name', 'Tags', 'Owner', 'description', 'status', 'priority', 'progress',
      'startDate', 'endDate', 'budget', 'spent', 'category'
    ]
  }

  async fetchProjects(filters = {}) {
    try {
      const params = {
        fields: this.fields,
        orderBy: [{ fieldName: 'Name', SortType: 'ASC' }]
      }

      if (filters.search) {
        params.where = [
          {
            fieldName: 'Name',
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

      if (filters.priority && filters.priority !== 'all') {
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
      console.error('Error fetching projects:', error)
      throw error
    }
  }

  async getProjectById(projectId) {
    try {
      const params = { fields: this.fields }
      const response = await this.client.getRecordById(this.tableName, projectId, params)
      return response?.data || null
    } catch (error) {
      console.error(`Error fetching project with ID ${projectId}:`, error)
      throw error
    }
  }

  async createProject(projectData) {
    try {
      // Filter to only include updateable fields
      const filteredData = {}
      this.updateableFields.forEach(field => {
        if (projectData[field] !== undefined) {
          filteredData[field] = projectData[field]
        }
      })

      // Ensure proper data formatting
      if (filteredData.budget) {
        filteredData.budget = parseFloat(filteredData.budget)
      }

      if (filteredData.spent) {
        filteredData.spent = parseFloat(filteredData.spent)
      }

      if (filteredData.progress !== undefined) {
        filteredData.progress = parseInt(filteredData.progress)
      }

      const params = {
        records: [filteredData]
      }

      const response = await this.client.createRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  async updateProject(projectId, projectData) {
    try {
      // Filter to only include updateable fields
      const filteredData = { Id: projectId }
      this.updateableFields.forEach(field => {
        if (projectData[field] !== undefined) {
          filteredData[field] = projectData[field]
        }
      })

      // Ensure proper data formatting
      if (filteredData.budget) {
        filteredData.budget = parseFloat(filteredData.budget)
      }

      if (filteredData.spent) {
        filteredData.spent = parseFloat(filteredData.spent)
      }

      if (filteredData.progress !== undefined) {
        filteredData.progress = parseInt(filteredData.progress)
      }

      const params = {
        records: [filteredData]
      }

      const response = await this.client.updateRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  async deleteProject(projectId) {
    try {
      const params = { RecordIds: [projectId] }
      const response = await this.client.deleteRecord(this.tableName, params)
      
      if (response?.success) {
        return true
      } else {
        throw new Error('Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }
}

export default new ProjectService()