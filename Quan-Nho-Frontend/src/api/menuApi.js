import { mockDb } from './mockDb'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export const menuApi = {
  async getMenu() {
    await delay(200)
    return mockDb.getMenu()
  },

  async saveItem(item) {
    await delay(300)
    if (!item.name || !item.name.trim()) {
      throw new Error('Tên món không được để trống')
    }
    if (!item.price || Number(item.price) <= 0) {
      throw new Error('Giá món phải lớn hơn 0 ₫')
    }
    return mockDb.saveMenuItem(item)
  },

  async toggleAvailability(id) {
    await delay(150)
    return mockDb.toggleItemAvailability(id)
  },

  async deleteItem(id) {
    await delay(200)
    return mockDb.deleteMenuItem(id)
  },

  async getCategories() {
    await delay(150)
    return mockDb.getCategories()
  },

  async saveCategory(category) {
    await delay(200)
    if (!category.name || !category.name.trim()) {
      throw new Error('Tên danh mục không được để trống')
    }
    return mockDb.saveCategory(category)
  },

  async deleteCategory(id) {
    await delay(200)
    return mockDb.deleteCategory(id)
  },

  async getToppings() {
    await delay(150)
    return mockDb.getToppings()
  },

  async saveTopping(topping) {
    await delay(200)
    if (!topping.name || !topping.name.trim()) {
      throw new Error('Tên topping không được để trống')
    }
    if (topping.price === undefined || Number(topping.price) < 0) {
      throw new Error('Giá topping không hợp lệ')
    }
    return mockDb.saveTopping(topping)
  },

  async deleteTopping(id) {
    await delay(200)
    return mockDb.deleteTopping(id)
  },
}
