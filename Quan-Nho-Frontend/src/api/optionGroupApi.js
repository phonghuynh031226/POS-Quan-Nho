import { mockDb } from './mockDb.js'

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export const optionGroupApi = {
  // Get all option groups
  async getOptionGroups() {
    await delay(150)
    return mockDb.getOptionGroups()
  },

  // Save (create or update) option group
  async saveOptionGroup(group) {
    await delay(200)
    if (!group.name || !group.name.trim()) {
      throw new Error('Tên nhóm tùy chọn không được để trống')
    }
    return mockDb.saveOptionGroup(group)
  },

  // Delete option group
  async deleteOptionGroup(id) {
    await delay(200)
    return mockDb.deleteOptionGroup(id)
  },

  // Get raw relations for a product
  async getProductOptionGroups(productId) {
    await delay(100)
    return mockDb.getProductOptionGroups(productId)
  },

  // Save relations between a product and option groups
  async saveProductOptionGroups(productId, relations) {
    await delay(200)
    return mockDb.saveProductOptionGroups(productId, relations)
  },

  // Get detailed option groups for a product (resolved with options, display order, and overrides)
  async getProductOptionGroupsDetailed(productId) {
    await delay(150)
    return mockDb.getProductOptionGroupsDetailed(productId)
  },
}
