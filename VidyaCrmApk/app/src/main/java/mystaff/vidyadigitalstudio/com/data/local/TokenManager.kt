package mystaff.vidyadigitalstudio.com.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import mystaff.vidyadigitalstudio.com.data.models.ProfilePictureDeserializer
import mystaff.vidyadigitalstudio.com.data.models.ProfilePictureDto
import mystaff.vidyadigitalstudio.com.data.models.UserDto

object TokenManager {

    private const val PREFS_FILE = "mystaff_secure_prefs"
    private const val KEY_AUTH_TOKEN = "auth_jwt_token"
    private const val KEY_USER_PROFILE = "current_user_profile"
    private const val KEY_CUSTOM_API_URL = "custom_base_api_url"

    private lateinit var prefs: SharedPreferences
    private val gson: Gson = GsonBuilder()
        .registerTypeAdapter(ProfilePictureDto::class.java, ProfilePictureDeserializer())
        .create()

    fun init(context: Context) {
        prefs = try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREFS_FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // Fallback to standard private preferences if keystore is unavailable
            context.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)
        }
    }

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_AUTH_TOKEN, token).apply()
    }

    fun getToken(): String? {
        return prefs.getString(KEY_AUTH_TOKEN, null)
    }

    fun clearToken() {
        prefs.edit().remove(KEY_AUTH_TOKEN).remove(KEY_USER_PROFILE).apply()
    }

    fun isLoggedIn(): Boolean {
        val token = getToken()
        return !token.isNullOrBlank()
    }

    fun saveUser(user: UserDto) {
        val json = gson.toJson(user)
        prefs.edit().putString(KEY_USER_PROFILE, json).apply()
    }

    fun getUser(): UserDto? {
        val json = prefs.getString(KEY_USER_PROFILE, null) ?: return null
        return try {
            gson.fromJson(json, UserDto::class.java)
        } catch (e: Exception) {
            null
        }
    }

    fun saveApiUrl(url: String) {
        prefs.edit().putString(KEY_CUSTOM_API_URL, url).apply()
    }

    fun getApiUrl(defaultUrl: String): String {
        return prefs.getString(KEY_CUSTOM_API_URL, defaultUrl) ?: defaultUrl
    }
}

