package mystaff.vidyadigitalstudio.com.data.repository

import mystaff.vidyadigitalstudio.com.data.api.ApiClient
import mystaff.vidyadigitalstudio.com.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class CrmRepository {

    private val api = ApiClient.getService()

    // --- Leaves ---
    suspend fun getLeaveBalance(): Result<LeaveBalanceDto> = withContext(Dispatchers.IO) {
        try {
            val response = api.getLeaveBalance()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data ?: LeaveBalanceDto())
            } else {
                Result.success(LeaveBalanceDto())
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Failed to fetch leave balance"))
        }
    }

    suspend fun getMyLeaves(): Result<List<LeaveDto>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getMyLeaves()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Failed to load leave history"))
        }
    }

    suspend fun applyLeave(type: String, start: String, end: String, reason: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.applyLeave(ApplyLeaveRequest(type, start, end, reason))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.message ?: "Leave application submitted successfully!")
            } else {
                Result.failure(Exception(response.body()?.message ?: "Application failed"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Network error submitting leave"))
        }
    }

    // --- Clients ---
    suspend fun getClients(): Result<List<ClientDto>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getClients()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Failed to load clients"))
        }
    }

    // --- Leads ---
    suspend fun getLeads(): Result<List<LeadDto>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getLeads()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Failed to load leads"))
        }
    }

    // --- Invoices ---
    suspend fun getInvoices(): Result<List<InvoiceDto>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getInvoices()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Failed to load invoices"))
        }
    }

    // --- Holidays ---
    suspend fun getHolidays(): Result<List<HolidayDto>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getHolidays()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Failed to load holidays"))
        }
    }
}

