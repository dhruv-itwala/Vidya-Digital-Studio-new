package mystaff.vidyadigitalstudio.com.data.models

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class LoginResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("token") val token: String?,
    @SerializedName("user") val user: UserDto?
)

data class UserDto(
    @SerializedName("_id") val id: String? = null,
    @SerializedName("name") val name: String = "",
    @SerializedName("email") val email: String = "",
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("role") val role: String = "employee",
    @SerializedName("subrole") val subrole: String? = null,
    @SerializedName("designation") val designation: String? = null,
    @SerializedName("department") val department: String? = null,
    @SerializedName("profilePicture") val profilePicture: String? = null,
    @SerializedName("requireOfficeWifi") val requireOfficeWifi: Boolean = true
)

data class ProfileResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: UserDto?
)

