package mystaff.vidyadigitalstudio.com.data.repository

import mystaff.vidyadigitalstudio.com.data.api.ApiClient
import mystaff.vidyadigitalstudio.com.data.models.TodayRecordDto
import mystaff.vidyadigitalstudio.com.data.models.WifiCheckResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AttendanceRepository {

    private val api = ApiClient.getService()

    suspend fun getTodayRecord(): Result<TodayRecordDto> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTodayRecord()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data ?: TodayRecordDto())
            } else {
                Result.success(TodayRecordDto())
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Failed to load today's attendance"))
        }
    }

    suspend fun checkWifi(): Result<WifiCheckResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api.checkWifi()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.success(WifiCheckResponse(success = true, isOnOfficeWifi = true))
            }
        } catch (e: Exception) {
            Result.success(WifiCheckResponse(success = true, isOnOfficeWifi = true))
        }
    }

    suspend fun punchIn(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.punchIn()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.message ?: "Punched in successfully!")
            } else {
                Result.failure(Exception(response.body()?.message ?: "Punch in failed"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Network error during punch in"))
        }
    }

    suspend fun punchOut(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.punchOut()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.message ?: "Punched out successfully!")
            } else {
                Result.failure(Exception(response.body()?.message ?: "Punch out failed"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Network error during punch out"))
        }
    }

    suspend fun breakIn(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.breakIn()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success("Break started")
            } else {
                Result.failure(Exception(response.body()?.message ?: "Break start failed"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun breakOut(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.breakOut()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success("Break ended")
            } else {
                Result.failure(Exception(response.body()?.message ?: "Break end failed"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun getMyAttendanceHistory(): Result<List<TodayRecordDto>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getMyAttendance()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Failed to fetch attendance history"))
        }
    }
}

