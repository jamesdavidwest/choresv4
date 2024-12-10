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

const fetchWithAuth = async (endpoint, options = {}, functionName = "") => {
	try {
		const token = localStorage.getItem("token");
		if (!token && endpoint !== "/auth/login") {
			console.error("No token found for authenticated request");
			throw new ApiError("Authentication required", 401, null, functionName);
		}

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
			localStorage.removeItem("token");
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

	// New method for bulk updates
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
		if (!credentials.username || !credentials.password) {
			throw new ApiError("Username and password are required", 400, null, "auth.login");
		}

		try {
			const response = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(credentials),
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
		const queryParams = new URLSearchParams({
			...params,
			startDate: params.startDate ? new Date(params.startDate).toISOString().split("T")[0] : undefined,
			endDate: params.endDate ? new Date(params.endDate).toISOString().split("T")[0] : undefined,
		}).toString();

		return fetchWithAuth(`/calendar/instances${queryParams ? `?${queryParams}` : ""}`, {}, "calendar.getInstances");
	},

	generateInstances: async (taskId, startDate, endDate) => {
		if (!taskId) throw new ApiError("Task ID is required", 400, null, "calendar.generateInstances");
		if (!startDate || !endDate) throw new ApiError("Start and end dates are required", 400, null, "calendar.generateInstances");

		return fetchWithAuth(
			"/calendar/generate",
			{
				method: "POST",
				body: JSON.stringify({
					taskId,
					startDate: new Date(startDate).toISOString().split("T")[0],
					endDate: new Date(endDate).toISOString().split("T")[0],
				}),
			},
			"calendar.generateInstances"
		);
	},
};

// Make sure both the class and its exports are available
export { ApiError };
