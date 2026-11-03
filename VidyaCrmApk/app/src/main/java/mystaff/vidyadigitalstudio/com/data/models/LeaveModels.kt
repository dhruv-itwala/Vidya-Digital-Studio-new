package mystaff.vidyadigitalstudio.com.data.models

import com.google.gson.annotations.SerializedName

data class LeaveBalanceResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: LeaveBalanceDto?
)

data class LeaveBalanceDto(
    @SerializedName("casualLeave") val casualLeave: Int = 0,
    @SerializedName("sickLeave") val sickLeave: Int = 0,
    @SerializedName("paidLeave") val paidLeave: Int = 0,
    @SerializedName("totalRemaining") val totalRemaining: Int = 0
)

data class LeaveListResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: List<LeaveDto> = emptyList()
)

data class LeaveDto(
    @SerializedName("_id") val id: String = "",
    @SerializedName("leaveType") val leaveType: String = "casual",
    @SerializedName("startDate") val startDate: String = "",
    @SerializedName("endDate") val endDate: String = "",
    @SerializedName("reason") val reason: String = "",
    @SerializedName("status") val status: String = "pending", // pending, approved, declined
    @SerializedName("rejectionReason") val rejectionReason: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class ApplyLeaveRequest(
    @SerializedName("leaveType") val leaveType: String,
    @SerializedName("startDate") val startDate: String,
    @SerializedName("endDate") val endDate: String,
    @SerializedName("reason") val reason: String
)

