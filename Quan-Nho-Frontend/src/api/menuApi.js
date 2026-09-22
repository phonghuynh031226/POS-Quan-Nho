import apiClient from './apiClient'

const body = (response) => response.data

export const menuApi = {
  async getMenu() { return body(await apiClient.get('/menu')) },
  async getCategories() { return body(await apiClient.get('/categories')) },
  async getToppings() { return body(await apiClient.get('/toppings')) },
  async saveItem(item) {
    return body(item.id
      ? await apiClient.put(`/menu/${item.id}`, item)
      : await apiClient.post('/menu', item))
  },
  async toggleAvailability(id) { return body(await apiClient.patch(`/menu/${id}/availability`)) },
  async deleteItem(id) { await apiClient.delete(`/menu/${id}`); return true },
  async saveCategory(category) {
    return body(category.id
      ? await apiClient.put(`/categories/${category.id}`, category)
      : await apiClient.post('/categories', category))
  },
  async deleteCategory(id) { await apiClient.delete(`/categories/${id}`); return true },
  async saveTopping(topping) {
    return body(topping.id
      ? await apiClient.put(`/toppings/${topping.id}`, topping)
      : await apiClient.post('/toppings', topping))
  },
  async deleteTopping(id) { await apiClient.delete(`/toppings/${id}`); return true },
}
