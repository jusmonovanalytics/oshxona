
export const authService = {
  /**
   * Foydalanuvchi sessiyasini tozalash va akkauntdan chiqish
   */
  logout() {
    localStorage.removeItem('erp_user');
    // Barcha holatlarni tozalash uchun sahifani reload qilamiz
    window.location.href = '/';
  },

  /**
   * Joriy foydalanuvchini localStorage dan olish
   */
  getCurrentUser() {
    const user = localStorage.getItem('erp_user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Foydalanuvchi ma'lumotlarini saqlash (login muvaffaqiyatli bo'lganda)
   */
  setUser(userData: any) {
    localStorage.setItem('erp_user', JSON.stringify(userData));
  }
};
