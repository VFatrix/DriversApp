import {
  apiRequest,
  saveToken,
  clearToken
} from "./api";

const authService = {
  login: async (username, password) => {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      authenticated: false,
      body: {
        username: username.trim(),
        password
      }
    });

    if (
      typeof response.token !== "string" ||
      !response.token.trim()
    ) {
      throw new Error("The login response did not contain a token.");
    }

    saveToken(response.token);

    return response;
  },

  getCurrentUser: async () => {
    return apiRequest("/api/auth/me");
  },

  logout: () => {
    clearToken();
  }
};

export default authService;