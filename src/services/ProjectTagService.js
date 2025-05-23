const { ApperClient } = window.ApperSDK

class ProjectTagService {
  constructor() {
    this.client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
    this.tableName = 'project_tag'
    this.fields = [
      'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy', 'project'
    ]
    this.updateableFields = ['Name', 'Tags', 'Owner', 'project']
  }

  async fetchProjectTags(projectId = null) {
    try {
      const params = {
        fields: this.fields,
        orderBy: [{ fieldName: 'Name', SortType: 'ASC' }]
      }

      if (projectId) {
        params.where = [
          {
            fieldName: 'project',
            operator: 'EqualTo',
            values: [projectId]
          }
        ]
      }

      const response = await this.client.fetchRecords(this.tableName, params)
      return response?.data || []
    } catch (error) {
      console.error('Error fetching project tags:', error)
      throw error
    }
  }

  async createProjectTag(tagData) {
    try {
      const filteredData = {}
      this.updateableFields.forEach(field => {
        if (tagData[field] !== undefined) {
          filteredData[field] = tagData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await this.client.createRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to create project tag')
      }
    } catch (error) {
      console.error('Error creating project tag:', error)
      throw error
    }
  }

  async updateProjectTag(tagId, tagData) {
    try {
      const filteredData = { Id: tagId }
      this.updateableFields.forEach(field => {
        if (tagData[field] !== undefined) {
          filteredData[field] = tagData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await this.client.updateRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to update project tag')
      }
    } catch (error) {
      console.error('Error updating project tag:', error)
      throw error
    }
  }

  async deleteProjectTag(tagId) {
    try {
      const params = { RecordIds: [tagId] }
      const response = await this.client.deleteRecord(this.tableName, params)
      
      if (response?.success) {
        return true
      } else {
        throw new Error('Failed to delete project tag')
      }
    } catch (error) {
      console.error('Error deleting project tag:', error)
      throw error
    }
  }
}

export default new ProjectTagService()