package mystaff.vidyadigitalstudio.com.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import mystaff.vidyadigitalstudio.com.data.models.*
import mystaff.vidyadigitalstudio.com.data.repository.CrmRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CrmUiState(
    val isLoading: Boolean = false,
    val selectedTab: Int = 0, // 0: Clients, 1: Leads, 2: Invoices, 3: Leaves, 4: Holidays
    val clients: List<ClientDto> = emptyList(),
    val leads: List<LeadDto> = emptyList(),
    val invoices: List<InvoiceDto> = emptyList(),
    val leaves: List<LeaveDto> = emptyList(),
    val leaveBalance: LeaveBalanceDto = LeaveBalanceDto(),
    val holidays: List<HolidayDto> = emptyList(),
    val searchQuery: String = "",
    val statusMessage: String? = null,
    val errorMessage: String? = null
)

class CrmViewModel(
    private val repository: CrmRepository = CrmRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(CrmUiState())
    val uiState: StateFlow<CrmUiState> = _uiState.asStateFlow()

    init {
        loadAllCrmData()
    }

    fun setSelectedTab(index: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = index)
    }

    fun setSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
    }

    fun loadAllCrmData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            val clientsRes = repository.getClients()
            val leadsRes = repository.getLeads()
            val invoicesRes = repository.getInvoices()
            val leavesRes = repository.getMyLeaves()
            val balanceRes = repository.getLeaveBalance()
            val holidaysRes = repository.getHolidays()

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                clients = clientsRes.getOrDefault(emptyList()),
                leads = leadsRes.getOrDefault(emptyList()),
                invoices = invoicesRes.getOrDefault(emptyList()),
                leaves = leavesRes.getOrDefault(emptyList()),
                leaveBalance = balanceRes.getOrDefault(LeaveBalanceDto()),
                holidays = holidaysRes.getOrDefault(emptyList())
            )
        }
    }

    fun applyLeave(type: String, start: String, end: String, reason: String) {
        if (reason.isBlank() || start.isBlank() || end.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please fill in all leave fields")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val res = repository.applyLeave(type, start, end, reason)
            res.onSuccess { msg ->
                _uiState.value = _uiState.value.copy(statusMessage = msg)
                loadAllCrmData()
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = err.message)
            }
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(statusMessage = null, errorMessage = null)
    }
}

