package mystaff.vidyadigitalstudio.com.data.repository

import mystaff.vidyadigitalstudio.com.data.api.ApiClient
import mystaff.vidyadigitalstudio.com.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class TaskRepository {

    private val api = ApiClient.getService()

    suspend fun getTasks(): Result<List<TaskDto>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTasks()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Failed to load tasks"))
        }
    }

    suspend fun updateTaskStatus(taskId: String, newStatus: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.updateTaskStatus(taskId, UpdateTaskStatusRequest(newStatus))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success("Task updated")
            } else {
                Result.failure(Exception(response.body()?.message ?: "Update failed"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Error updating task"))
        }
    }

    suspend fun getTodoList(): Result<List<TodoDto>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTodoList()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Failed to load to-do items"))
        }
    }

    suspend fun createTodo(title: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.createTodo(CreateTodoRequest(title))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success("Todo created")
            } else {
                Result.failure(Exception("Failed to add todo"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun toggleTodo(id: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.toggleTodo(id)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success("Todo updated")
            } else {
                Result.failure(Exception("Failed to update"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun deleteTodo(id: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteTodo(id)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success("Todo deleted")
            } else {
                Result.failure(Exception("Failed to delete"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Network error"))
        }
    }
}

