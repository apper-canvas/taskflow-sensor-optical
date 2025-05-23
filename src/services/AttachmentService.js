const { ApperClient } = window.ApperSDK

class AttachmentService {
  constructor() {
    this.client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
    this.tableName = 'Attachment1'
    this.fields = [
      'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
      'size', 'type', 'url', 'uploadedAt', 'task'
    ]
    this.updateableFields = [
      'Name', 'Tags', 'Owner', 'size', 'type', 'url', 'uploadedAt', 'task'
    ]
  }

  async fetchAttachments(taskId = null) {
    try {
      const params = {
        fields: this.fields,
        orderBy: [{ fieldName: 'uploadedAt', SortType: 'DESC' }]
      }

      if (taskId) {
        params.where = [
          {
            fieldName: 'task',
            operator: 'EqualTo',
            values: [taskId]
          }
        ]
      }

      const response = await this.client.fetchRecords(this.tableName, params)
      return response?.data || []
    } catch (error) {
      console.error('Error fetching attachments:', error)
      throw error
    }
  }

  async createAttachment(attachmentData) {
    try {
      // Filter to only include updateable fields
      const filteredData = {}
      this.updateableFields.forEach(field => {
        if (attachmentData[field] !== undefined) {
          filteredData[field] = attachmentData[field]
        }
      })

      // Ensure proper data formatting
      if (filteredData.size) {
        filteredData.size = parseInt(filteredData.size)
      }

      if (filteredData.uploadedAt && typeof filteredData.uploadedAt === 'string') {
        // DateTime format: YYYY-MM-DDThh:mm:ss
        filteredData.uploadedAt = filteredData.uploadedAt
      }

      const params = {
        records: [filteredData]
      }

      const response = await this.client.createRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to create attachment')
      }
    } catch (error) {
      console.error('Error creating attachment:', error)
      throw error
    }
  }

  async updateAttachment(attachmentId, attachmentData) {
    try {
      const filteredData = { Id: attachmentId }
      this.updateableFields.forEach(field => {
        if (attachmentData[field] !== undefined) {
          filteredData[field] = attachmentData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await this.client.updateRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to update attachment')
      }
    } catch (error) {
      console.error('Error updating attachment:', error)
      throw error
    }
  }

  async deleteAttachment(attachmentId) {
    try {
      const params = { RecordIds: [attachmentId] }
      const response = await this.client.deleteRecord(this.tableName, params)
      
      if (response?.success) {
        return true
      } else {
        throw new Error('Failed to delete attachment')
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      throw error
    }
  }
}

export default new AttachmentService()