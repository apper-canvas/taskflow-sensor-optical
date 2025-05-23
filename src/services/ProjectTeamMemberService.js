const { ApperClient } = window.ApperSDK

class ProjectTeamMemberService {
  constructor() {
    this.client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
    this.tableName = 'project_team_member'
    this.fields = [
      'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy', 'project'
    ]
    this.updateableFields = ['Name', 'Tags', 'Owner', 'project']
  }

  async fetchTeamMembers(projectId = null) {
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
      console.error('Error fetching team members:', error)
      throw error
    }
  }

  async createTeamMember(memberData) {
    try {
      const filteredData = {}
      this.updateableFields.forEach(field => {
        if (memberData[field] !== undefined) {
          filteredData[field] = memberData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await this.client.createRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to create team member')
      }
    } catch (error) {
      console.error('Error creating team member:', error)
      throw error
    }
  }

  async updateTeamMember(memberId, memberData) {
    try {
      const filteredData = { Id: memberId }
      this.updateableFields.forEach(field => {
        if (memberData[field] !== undefined) {
          filteredData[field] = memberData[field]
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await this.client.updateRecord(this.tableName, params)
      
      if (response?.success && response?.results?.[0]?.success) {
        return response.results[0].data
      } else {
        throw new Error(response?.results?.[0]?.message || 'Failed to update team member')
      }
    } catch (error) {
      console.error('Error updating team member:', error)
      throw error
    }
  }

  async deleteTeamMember(memberId) {
    try {
      const params = { RecordIds: [memberId] }
      const response = await this.client.deleteRecord(this.tableName, params)
      
      if (response?.success) {
        return true
      } else {
        throw new Error('Failed to delete team member')
      }
    } catch (error) {
      console.error('Error deleting team member:', error)
      throw error
    }
  }
}

export default new ProjectTeamMemberService()