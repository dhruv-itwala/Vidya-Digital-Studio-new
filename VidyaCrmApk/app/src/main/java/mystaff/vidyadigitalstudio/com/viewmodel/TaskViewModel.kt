package mystaff.vidyadigitalstudio.com.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import mystaff.vidyadigitalstudio.com.data.models.TaskDto
import mystaff.vidyadigitalstudio.com.data.models.TodoDto
import mystaff.vidyadigitalstudio.com.data.repository.TaskRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TaskUiState(
    val isLoading: Boolean = false,
    val tasks: List<TaskDto> = emptyList(),
    val todos: List<TodoDto> = emptyList(),
    val selectedFilter: String = "ALL", // ALL, PENDING, IN_PROGRESS, COMPLETED
    val statusMessage: String? = null,
    val errorMessage: String? = null
)

class TaskViewModel(
    private val repository: TaskRepository = TaskRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(TaskUiState())
    val uiState: StateFlow<TaskUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val taskRes = repository.getTasks()
            val todoRes = repository.getTodoList()

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                tasks = taskRes.getOrDefault(emptyList()),
                todos = todoRes.getOrDefault(emptyList())
            )
        }
    }

    fun setFilter(filter: String) {
        _uiState.value = _uiState.value.copy(selectedFilter = filter)
    }

    fun updateTaskStatus(taskId: String, newStatus: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val res = repository.updateTaskStatus(taskId, newStatus)
            res.onSuccess {
                loadData()
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = err.message)
            }
        }
    }

    fun addTodo(title: String) {
        if (title.isBlank()) return
        viewModelScope.launch {
            repository.createTodo(title.trim())
            loadData()
        }
    }

    fun toggleTodo(id: String) {
        viewModelScope.launch {
            repository.toggleTodo(id)
            loadData()
        }
    }

    fun deleteTodo(id: String) {
        viewModelScope.launch {
            repository.deleteTodo(id)
            loadData()
        }
    }
}

