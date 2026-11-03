package mystaff.vidyadigitalstudio.com.data.models

import com.google.gson.annotations.SerializedName

data class TaskListResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: List<TaskDto> = emptyList()
)

data class TaskDto(
    @SerializedName("_id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("description") val description: String? = null,
    @SerializedName("priority") val priority: String = "medium", // low, medium, high, urgent
    @SerializedName("status") val status: String = "pending",     // pending, in_progress, completed
    @SerializedName("dueDate") val dueDate: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("assignedTo") val assignedTo: Any? = null
)

data class UpdateTaskStatusRequest(
    @SerializedName("status") val status: String
)

data class TodoListResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: List<TodoDto> = emptyList()
)

data class TodoDto(
    @SerializedName("_id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("isCompleted") val isCompleted: Boolean = false,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class CreateTodoRequest(
    @SerializedName("title") val title: String
)
