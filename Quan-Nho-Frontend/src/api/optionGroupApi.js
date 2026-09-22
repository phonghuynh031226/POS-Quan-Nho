import apiClient from './apiClient'

const body = (response) => response.data

export const optionGroupApi = {
  async getOptionGroups() { return body(await apiClient.get('/options')) },
  async saveOptionGroup(group) {
    return body(group.id
      ? await apiClient.put(`/options/${group.id}`, group)
      : await apiClient.post('/options', group))
  },
  async deleteOptionGroup(id) { await apiClient.delete(`/options/${id}`); return true },
  async getProductOptionGroups(productId) {
    return body(await apiClient.get(productId ? `/products/${productId}/option-groups` : '/product-option-groups'))
  },
  async saveProductOptionGroups(productId, relations) {
    return body(await apiClient.put(`/products/${productId}/option-groups`, relations))
  },
  async getProductOptionGroupsDetailed(productId) {
    return body(await apiClient.get(`/products/${productId}/option-groups/detailed`))
  },
}
