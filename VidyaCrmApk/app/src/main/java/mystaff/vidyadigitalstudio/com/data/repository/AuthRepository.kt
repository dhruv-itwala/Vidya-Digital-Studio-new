package mystaff.vidyadigitalstudio.com.data.repository

import mystaff.vidyadigitalstudio.com.data.api.ApiClient
import mystaff.vidyadigitalstudio.com.data.local.TokenManager
import mystaff.vidyadigitalstudio.com.data.models.LoginRequest
import mystaff.vidyadigitalstudio.com.data.models.UserDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository {

    private val api = ApiClient.getService()

    suspend fun login(email: String, pass: String): Result<UserDto> = withContext(Dispatchers.IO) {
        try {
            val response = api.login(LoginRequest(email.trim(), pass))
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                body.token?.let { TokenManager.saveToken(it) }
                body.user?.let { TokenManager.saveUser(it) }
                Result.success(body.user ?: UserDto(name = "Employee", email = email))
            } else {
                val errorMsg = response.body()?.message ?: "Invalid email or password"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Failed to connect to server"))
        }
    }

    suspend fun getProfile(): Result<UserDto> = withContext(Dispatchers.IO) {
        try {
            val response = api.getProfile()
            if (response.isSuccessful && response.body()?.success == true) {
                val user = response.body()!!.data
                user?.let { TokenManager.saveUser(it) }
                Result.success(user ?: TokenManager.getUser() ?: UserDto())
            } else {
                Result.success(TokenManager.getUser() ?: UserDto())
            }
        } catch (e: Exception) {
            // Offline fallback to locally cached user
            TokenManager.getUser()?.let { Result.success(it) }
                ?: Result.failure(Exception("Unable to fetch profile"))
        }
    }

    fun logout() {
        TokenManager.clearToken()
    }

    fun isLoggedIn(): Boolean {
        return TokenManager.isLoggedIn()
    }

    fun getCurrentUser(): UserDto? {
        return TokenManager.getUser()
    }
}

