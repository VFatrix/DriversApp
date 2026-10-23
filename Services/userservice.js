import { apiRequest } from "./api";

const userService = {
  getAll: () => apiRequest("/api/users"),

  createDriver: (fullName, username, password) =>
    apiRequest("/api/users", {
      method: "POST",
      body: {
        fullName: fullName.trim(),
        username: username.trim(),
        password,
        role: "Driver"
      }

    }),


            archiveDriver: (userId) =>
            apiRequest(`/api/users/${userId}/archive`, {
              method: "PUT"
               }),


  resetPassword: (userId, newPassword) =>
    apiRequest(`/api/users/${userId}/password`, {
      method: "PUT",
      body: { newPassword }
    })
};

export default userService;