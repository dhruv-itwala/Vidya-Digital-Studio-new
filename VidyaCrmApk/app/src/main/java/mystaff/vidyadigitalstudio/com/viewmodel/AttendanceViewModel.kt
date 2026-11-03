package mystaff.vidyadigitalstudio.com.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import mystaff.vidyadigitalstudio.com.data.models.TodayRecordDto
import mystaff.vidyadigitalstudio.com.data.repository.AttendanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AttendanceUiState(
    val isLoading: Boolean = false,
    val todayRecord: TodayRecordDto = TodayRecordDto(),
    val history: List<TodayRecordDto> = emptyList(),
    val isOnOfficeWifi: Boolean = true,
    val statusMessage: String? = null,
    val errorMessage: String? = null
)

class AttendanceViewModel(
    private val repository: AttendanceRepository = AttendanceRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(AttendanceUiState())
    val uiState: StateFlow<AttendanceUiState> = _uiState.asStateFlow()

    init {
        refreshAttendance()
    }

    fun refreshAttendance() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val wifiRes = repository.checkWifi()
            val wifiOk = wifiRes.getOrNull()?.isOnOfficeWifi ?: true

            val todayRes = repository.getTodayRecord()
            val histRes = repository.getMyAttendanceHistory()

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isOnOfficeWifi = wifiOk,
                todayRecord = todayRes.getOrDefault(TodayRecordDto()),
                history = histRes.getOrDefault(emptyList())
            )
        }
    }

    fun punchIn() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = repository.punchIn()
            result.onSuccess { msg ->
                _uiState.value = _uiState.value.copy(statusMessage = msg)
                refreshAttendance()
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = err.message)
            }
        }
    }

    fun punchOut() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = repository.punchOut()
            result.onSuccess { msg ->
                _uiState.value = _uiState.value.copy(statusMessage = msg)
                refreshAttendance()
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = err.message)
            }
        }
    }

    fun toggleBreak() {
        val onBreak = _uiState.value.todayRecord.isOnBreak
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = if (onBreak) repository.breakOut() else repository.breakIn()
            result.onSuccess { msg ->
                _uiState.value = _uiState.value.copy(statusMessage = msg)
                refreshAttendance()
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = err.message)
            }
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(statusMessage = null, errorMessage = null)
    }
}

