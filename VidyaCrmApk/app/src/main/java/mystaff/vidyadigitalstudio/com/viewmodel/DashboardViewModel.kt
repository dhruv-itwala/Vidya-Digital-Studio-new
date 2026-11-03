package mystaff.vidyadigitalstudio.com.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import mystaff.vidyadigitalstudio.com.data.models.TodayRecordDto
import mystaff.vidyadigitalstudio.com.data.models.UserDto
import mystaff.vidyadigitalstudio.com.data.repository.AttendanceRepository
import mystaff.vidyadigitalstudio.com.data.repository.AuthRepository
import mystaff.vidyadigitalstudio.com.data.repository.TaskRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val isLoading: Boolean = false,
    val user: UserDto? = null,
    val todayRecord: TodayRecordDto = TodayRecordDto(),
    val pendingTasksCount: Int = 0,
    val errorMessage: String? = null
)

class DashboardViewModel(
    private val authRepository: AuthRepository = AuthRepository(),
    private val attendanceRepository: AttendanceRepository = AttendanceRepository(),
    private val taskRepository: TaskRepository = TaskRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            val profileRes = authRepository.getProfile()
            val todayRes = attendanceRepository.getTodayRecord()
            val taskRes = taskRepository.getTasks()

            val pendingCount = taskRes.getOrDefault(emptyList())
                .count { it.status.lowercase() != "completed" }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                user = profileRes.getOrNull() ?: authRepository.getCurrentUser(),
                todayRecord = todayRes.getOrDefault(TodayRecordDto()),
                pendingTasksCount = pendingCount
            )
        }
    }
}

