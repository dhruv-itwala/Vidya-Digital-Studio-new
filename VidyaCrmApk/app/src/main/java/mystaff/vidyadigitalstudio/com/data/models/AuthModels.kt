package mystaff.vidyadigitalstudio.com.data.models

import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import com.google.gson.annotations.JsonAdapter
import com.google.gson.annotations.SerializedName
import java.lang.reflect.Type

@JsonAdapter(ProfilePictureDeserializer::class)
data class ProfilePictureDto(
    @SerializedName("url") val url: String? = null,
    @SerializedName("public_id") val publicId: String? = null
)

class ProfilePictureDeserializer : JsonDeserializer<ProfilePictureDto> {
    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): ProfilePictureDto? {
        if (json == null || json.isJsonNull) return null
        return try {
            if (json.isJsonObject) {
                val obj = json.asJsonObject
                val url = if (obj.has("url") && !obj.get("url").isJsonNull) obj.get("url").asString else null
                val publicId = if (obj.has("public_id") && !obj.get("public_id").isJsonNull) obj.get("public_id").asString else null
                ProfilePictureDto(url = url, publicId = publicId)
            } else if (json.isJsonPrimitive) {
                ProfilePictureDto(url = json.asString, publicId = null)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class LoginResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String? = null,
    @SerializedName("token") val token: String? = null,
    @SerializedName("user") val user: UserDto? = null
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
    @SerializedName("profilePicture") val profilePicture: ProfilePictureDto? = null,
    @SerializedName("requireOfficeWifi") val requireOfficeWifi: Boolean = true
) {
    val avatarUrl: String?
        get() = profilePicture?.url
}

data class ProfileResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: UserDto? = null,
    @SerializedName("user") val user: UserDto? = null
)

