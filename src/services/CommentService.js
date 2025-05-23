const { ApperClient } = window.ApperSDK

class CommentService {
  constructor() {
    this.client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
    this.tableName = 'Comment1'
    this.fields = [
      'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
      'text', 'author', 'avatar', 'createdAt', 'parentComment', 'task'
    ]
    this.updateableFields = [
      'Name', 'Tags', 'Owner', 'text', 'author', 'avatar', 'createdAt', 'parentComment', 'task'
    ]
  }

  async fetchComments(taskId = null) {
    try {
      const params = {
        fields: this.fields,
        orderBy: [{ fieldName: 'createdAt', SortType: 'DESC' }]
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
      console.error('Error fetching comments:', error)
      throw error
    }
  }

  async createComment(commentData) {
    try {
      // Filter to only include updateable fields
      const filteredData = {}
      this.updateableFields.forEach(field => {
        if (commentData[field] !== undefined) {
          filteredData[field] = commentData[field]
        }
      })

      // Ensure proper data formatting
      if (filteredData.createdAt && typeof filteredData.createdAt === 'string') {
        // DateTime format: YYYY-MM-DDThh:mm:ss
        filteredData.createdAt = filteredData.createdAt
      }

      const params = {
        records: [filteredData]
      }

      const response = await this.client.createRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to create comment')
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      throw error
    }
  }

  async updateComment(commentId, commentData) {
    try {
      const filteredData = { Id: commentId }
      this.updateableFields.forEach(field => {
        if (commentData[field] !== undefined) {
          filteredData[field] = commentData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await this.client.updateRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to update comment')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      throw error
    }
  }

  async deleteComment(commentId) {
    try {
      const params = { RecordIds: [commentId] }
      const response = await this.client.deleteRecord(this.tableName, params)
      
      if (response?.success) {
        return true
      } else {
        throw new Error('Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  }
}

export default new CommentService()