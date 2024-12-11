const API_URL = "http://localhost:3001/api";
const DEFAULT_TIMEOUT = 15000;
const BATCH_SIZE = 50;

class ApiError extends Error {
	constructor(message, status, data, functionName = "") {
		super(message);
		this.status = status;
		this.data = data;
		this.functionName = functionName;
		this.name = "ApiError";
		this.fullMessage = functionName ? `${functionName}: ${message}` : message;
	}

	toString() {
		return this.fullMessage;
	}
}

const fetchWithTimeout = (resource, options = {}) => {
	const { timeout = DEFAULT_TIMEOUT } = options;
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	return fetch(resource, {
		...options,
		signal: controller.signal,
	}).finally(() => clearTimeout(id));
};

// Helper function to check if we're in the middle of auth initialization
const isAuthInitializing = () => {
	// Check if we're in the auth loading state by looking for the loading indicator
	const loadingIndicator = document.querySelector(".auth-loading-indicator");
	return !!loadingIndicator;
};

const fetchWithAuth = async (endpoint, options = {}, functionName = "") => {
	// Skip auth check for login endpoint
	if (endpoint !== "/auth/login") {
		// Check if we're still initializing auth
		if (isAuthInitializing()) {
			console.log(`Delaying ${functionName} request - auth is still initializing`);
			// Wait for a short period and check again
			await new Promise((resolve) => setTimeout(resolve, 100));
			if (isAuthInitializing()) {
				throw new ApiError("Authentication is still initializing", 401, null, functionName);
			}
		}

		// Check for token before making the request
		const token = localStorage.getItem("token");
		if (!token) {
			console.error("No token found for authenticated request");
			// Clear any stale data
			localStorage.removeItem("user");
			window.location.href = "/signin";
			throw new ApiError("Authentication required", 401, null, functionName);
		}
	}

	try {
		const token = localStorage.getItem("token");
		const headers = {
			"Content-Type": "application/json",
			...(token && { Authorization: `Bearer ${token}` }),
			...options.headers,
		};

		const requestOptions = {
			...options,
			headers,
		};

		console.log(`API Request: ${endpoint}`, {
			method: options.method || "GET",
			headers: { ...headers, Authorization: token ? "Bearer [REDACTED]" : undefined },
			body: options.body ? JSON.parse(options.body) : undefined,
		});

		const response = await fetchWithTimeout(`${API_URL}${endpoint}`, requestOptions);

		console.log(`API Response: ${endpoint}`, {
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries()),
		});

		if (response.status === 401) {
			// Clear any stale data
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			window.location.href = "/signin";
			throw new ApiError("Session expired. Please login again.", 401, null, functionName);
		}

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (e) {
				errorData = {
					message: `Server returned ${response.status}: ${response.statusText}`,
					status: response.status,
				};
			}
			throw new ApiError(errorData.message || `Request failed with status ${response.status}`, response.status, errorData, functionName);
		}

		if (response.status === 204) {
			return null;
		}

		const data = await response.json();
		console.log(`API Data: ${endpoint}`, data);
		return data;
	} catch (error) {
		console.error(`API Error in ${functionName}:`, {
			message: error.message,
			status: error.status,
			data: error.data,
			stack: error.stack,
		});

		if (error.name === "AbortError") {
			throw new ApiError("Request timeout - please try again", 408, null, functionName);
		}
		if (error instanceof ApiError) {
			error.functionName = functionName || error.functionName;
			throw error;
		}
		throw new ApiError(error.message || "Network error", 0, null, functionName);
	}
};

// Cache for batch operations
const batchCache = new Map();

export const tasks = {
	getAll: async (params = {}) => {
		const queryParams = { ...params };

		// Handle userId parameter
		if (queryParams.userId === null || queryParams.userId === undefined) {
			delete queryParams.userId;
		} else {
			queryParams.userId = parseInt(queryParams.userId, 10);
		}

		// Handle date range parameters
		if (queryParams.startDate) {
			queryParams.startDate = new Date(queryParams.startDate).toISOString().split("T")[0];
		}
		if (queryParams.endDate) {
			queryParams.endDate = new Date(queryParams.endDate).toISOString().split("T")[0];
		}

		const queryString = new URLSearchParams(queryParams).toString();
		const cacheKey = `tasks-${queryString}`;

		// Check cache first
		if (batchCache.has(cacheKey)) {
			return batchCache.get(cacheKey);
		}

		const data = await fetchWithAuth(`/tasks${queryString ? `?${queryString}` : ""}`, {}, "tasks.getAll");

		// Cache the result
		batchCache.set(cacheKey, data);

		// Clear cache after 5 minutes
		setTimeout(() => batchCache.delete(cacheKey), 300000);

		return data;
	},

	getById: (id) => {
		if (!id) throw new ApiError("Task ID is required", 400, null, "tasks.getById");
		return fetchWithAuth(`/tasks/${id}`, {}, "tasks.getById");
	},

	create: async (taskData) => {
		if (!taskData.name || !taskData.location_id) {
			throw new ApiError("Name and location are required", 400, null, "tasks.create");
		}

		// Validate due time if provided
		if (taskData.time_preference) {
			const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
			if (!timeRegex.test(taskData.time_preference)) {
				throw new ApiError("Invalid time format. Use HH:mm:ss format (e.g., 09:00:00)", 400, null, "tasks.create");
			}
		}

		const result = await fetchWithAuth(
			"/tasks",
			{
				method: "POST",
				body: JSON.stringify(taskData),
			},
			"tasks.create"
		);

		// Clear all cache entries as new task affects all queries
		batchCache.clear();

		return result;
	},

	update: async (id, taskData) => {
		if (!id) throw new ApiError("Task ID is required", 400, null, "tasks.update");

		const result = await fetchWithAuth(
			`/tasks/${id}`,
			{
				method: "PUT",
				body: JSON.stringify(taskData),
			},
			"tasks.update"
		);

		// Clear all cache entries as update affects all queries
		batchCache.clear();

		return result;
	},

	delete: async (id) => {
		if (!id) throw new ApiError("Task ID is required", 400, null, "tasks.delete");

		const result = await fetchWithAuth(
			`/tasks/${id}`,
			{
				method: "DELETE",
			},
			"tasks.delete"
		);

		// Clear all cache entries as deletion affects all queries
		batchCache.clear();

		return result;
	},

	toggleComplete: async (taskId, instanceId) => {
		if (!taskId) throw new ApiError("Task ID is required", 400, null, "tasks.toggleComplete");
		if (!instanceId) throw new ApiError("Instance ID is required", 400, null, "tasks.toggleComplete");

		try {
			// Get current instance state
			const currentTask = await fetchWithAuth(`/tasks/${taskId}`, {}, "tasks.toggleComplete.get");
			const currentInstance = currentTask.instances?.find((i) => i.id === parseInt(instanceId));

			if (!currentInstance) {
				throw new ApiError("Instance not found", 404, null, "tasks.toggleComplete");
			}

			// Optimistic update in cache
			batchCache.forEach((value, key) => {
				if (key.startsWith("tasks-")) {
					const updatedData = value.map((task) => {
						if (task.id === taskId) {
							return {
								...task,
								instances: task.instances?.map((instance) => {
									if (instance.id === parseInt(instanceId)) {
										return {
											...instance,
											is_complete: !currentInstance.is_complete,
											completed_at: !currentInstance.is_complete ? new Date().toISOString() : null,
										};
									}
									return instance;
								}),
							};
						}
						return task;
					});
					batchCache.set(key, updatedData);
				}
			});

			const response = await fetchWithAuth(
				`/tasks/${taskId}/instances/${instanceId}`,
				{
					method: "PUT",
					body: JSON.stringify({
						is_complete: !currentInstance.is_complete,
					}),
				},
				"tasks.toggleComplete.instance"
			);

			return response;
		} catch (error) {
			// Revert optimistic updates on error
			batchCache.clear();

			console.error("Toggle complete error:", {
				taskId,
				instanceId,
				error: error.message,
				stack: error.stack,
			});
			throw error;
		}
	},

	updateBatch: async (updates) => {
		if (!Array.isArray(updates) || updates.length === 0) {
			throw new ApiError("Updates array is required", 400, null, "tasks.updateBatch");
		}

		const results = [];
		for (let i = 0; i < updates.length; i += BATCH_SIZE) {
			const batch = updates.slice(i, i + BATCH_SIZE);
			const batchResults = await fetchWithAuth(
				"/tasks/batch",
				{
					method: "PUT",
					body: JSON.stringify({ updates: batch }),
				},
				"tasks.updateBatch"
			);
			results.push(...batchResults);

			// Allow UI to update between batches
			await new Promise((resolve) => setTimeout(resolve, 0));
		}

		// Clear cache after batch update
		batchCache.clear();

		return results;
	},
};

export const auth = {
	login: async (credentials) => {
		if (!credentials.username && !credentials.email) {
			throw new ApiError("Username or email is required", 400, null, "auth.login");
		}
		if (!credentials.password) {
			throw new ApiError("Password is required", 400, null, "auth.login");
		}

		try {
			// Convert username to expected email format if needed
			const loginData = {
				email: credentials.email || credentials.username,
				password: credentials.password,
			};

			const response = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(loginData),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new ApiError(error.message || error.error || "Login failed", response.status, null, "auth.login");
			}

			const data = await response.json();

			if (data.token) {
				localStorage.setItem("token", data.token);
				return data;
			} else {
				throw new ApiError("No token received from server", 500, null, "auth.login");
			}
		} catch (error) {
			console.error("Login error details:", error);
			if (error instanceof ApiError) throw error;
			throw new ApiError(error.message || "Login failed", 500, null, "auth.login");
		}
	},

	getCurrentUser: () => fetchWithAuth("/auth/me", {}, "auth.getCurrentUser"),

	logout: () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		batchCache.clear();
	},

	isAuthenticated: () => {
		return !!localStorage.getItem("token");
	},
};

export const users = {
	getAll: () => fetchWithAuth("/users", {}, "users.getAll"),
	getById: (id) => {
		if (!id) throw new ApiError("User ID is required", 400, null, "users.getById");
		return fetchWithAuth(`/users/${id}`, {}, "users.getById");
	},
	update: (id, userData) => {
		if (!id) throw new ApiError("User ID is required", 400, null, "users.update");
		return fetchWithAuth(
			`/users/${id}`,
			{
				method: "PUT",
				body: JSON.stringify(userData),
			},
			"users.update"
		);
	},
};

export const locations = {
	getAll: () => fetchWithAuth("/locations", {}, "locations.getAll"),
	getById: (id) => {
		if (!id) throw new ApiError("Location ID is required", 400, null, "locations.getById");
		return fetchWithAuth(`/locations/${id}`, {}, "locations.getById");
	},
	create: (locationData) => {
		if (!locationData.name) {
			throw new ApiError("Location name is required", 400, null, "locations.create");
		}
		return fetchWithAuth(
			"/locations",
			{
				method: "POST",
				body: JSON.stringify(locationData),
			},
			"locations.create"
		);
	},
	update: (id, locationData) => {
		if (!id) throw new ApiError("Location ID is required", 400, null, "locations.update");
		return fetchWithAuth(
			`/locations/${id}`,
			{
				method: "PUT",
				body: JSON.stringify(locationData),
			},
			"locations.update"
		);
	},
	delete: (id) => {
		if (!id) throw new ApiError("Location ID is required", 400, null, "locations.delete");
		return fetchWithAuth(
			`/locations/${id}`,
			{
				method: "DELETE",
			},
			"locations.delete"
		);
	},
};

export const notifications = {
	getAll: async (params = {}) => {
		const queryParams = new URLSearchParams(params).toString();
		return fetchWithAuth(`/notifications${queryParams ? `?${queryParams}` : ""}`, {}, "notifications.getAll");
	},

	markAsRead: async (id) => {
		if (!id) throw new ApiError("Notification ID is required", 400, null, "notifications.markAsRead");
		return fetchWithAuth(
			`/notifications/${id}/read`,
			{
				method: "PUT",
			},
			"notifications.markAsRead"
		);
	},

	getUnreadCount: async () => {
		return fetchWithAuth("/notifications/unread/count", {}, "notifications.getUnreadCount");
	},
};

export const calendar = {
	getInstances: async (params = {}) => {
		// Convert camelCase parameters to snake_case and validate
		const validParams = {};

		// Handle date parameters
		if (params.startDate) {
			const startDate = new Date(params.startDate);
			if (isNaN(startDate.getTime())) {
				throw new ApiError("Invalid start date", 400, null, "calendar.getInstances");
			}
			validParams.start_date = startDate.toISOString().split("T")[0];
		}

		if (params.endDate) {
			const endDate = new Date(params.endDate);
			if (isNaN(endDate.getTime())) {
				throw new ApiError("Invalid end date", 400, null, "calendar.getInstances");
			}
			validParams.end_date = endDate.toISOString().split("T")[0];
		}

		// Handle ID parameters with proper parsing
		if (params.userId !== undefined && params.userId !== null) {
			const userId = parseInt(params.userId, 10);
			if (!isNaN(userId)) {
				validParams.user_id = userId;
			}
		}

		if (params.categoryId !== undefined && params.categoryId !== null) {
			const categoryId = parseInt(params.categoryId, 10);
			if (!isNaN(categoryId)) {
				validParams.category_id = categoryId;
			}
		}

		if (params.locationId !== undefined && params.locationId !== null) {
			const locationId = parseInt(params.locationId, 10);
			if (!isNaN(locationId)) {
				validParams.location_id = locationId;
			}
		}

		// Handle status parameter
		if (params.status) {
			validParams.status = params.status;
		}

		// Create query string, filtering out undefined values
		const queryString = new URLSearchParams(
			Object.entries(validParams)
				.filter(([, value]) => value !== undefined && value !== null)
				.map(([key, value]) => [key, value.toString()])
		).toString();

		return fetchWithAuth(
			`/calendar/events${queryString ? `?${queryString}` : ""}`,
			{},
			"calendar.getInstances"
		);
	},

	moveEvent: async (instanceId, date, time) => {
		if (!instanceId) throw new ApiError("Instance ID is required", 400, null, "calendar.moveEvent");
		if (!date) throw new ApiError("Date is required", 400, null, "calendar.moveEvent");

		return fetchWithAuth(
			`/calendar/events/${instanceId}/move`,
			{
				method: "PUT",
				body: JSON.stringify({
					due_date: new Date(date).toISOString().split("T")[0],
					due_time: time || "09:00:00",
				}),
			},
			"calendar.moveEvent"
		);
	},
};

export { ApiError };