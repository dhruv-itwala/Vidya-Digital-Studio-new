package mystaff.vidyadigitalstudio.com.data.models

import com.google.gson.annotations.SerializedName

data class TodayRecordResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: TodayRecordDto?
)

data class TodayRecordDto(
    @SerializedName("_id") val id: String? = null,
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("date") val date: String? = null,
    @SerializedName("punchIn") val punchIn: String? = null,
    @SerializedName("punchOut") val punchOut: String? = null,
    @SerializedName("breaks") val breaks: List<BreakDto> = emptyList(),
    @SerializedName("status") val status: String? = null,
    @SerializedName("workMinutes") val workMinutes: Int = 0,
    @SerializedName("isPunchIn") val isPunchIn: Boolean = false,
    @SerializedName("isOnBreak") val isOnBreak: Boolean = false
)

data class BreakDto(
    @SerializedName("breakIn") val breakIn: String? = null,
    @SerializedName("breakOut") val breakOut: String? = null,
    @SerializedName("reason") val reason: String? = null
)

data class PunchResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: Any?
)

data class WifiCheckResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("isOnOfficeWifi") val isOnOfficeWifi: Boolean = true,
    @SerializedName("clientIp") val clientIp: String? = null
)

data class AttendanceHistoryResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: List<TodayRecordDto> = emptyList()
)

