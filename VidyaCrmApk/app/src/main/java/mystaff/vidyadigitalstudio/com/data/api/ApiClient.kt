package mystaff.vidyadigitalstudio.com.data.api

import android.content.Context
import mystaff.vidyadigitalstudio.com.data.local.TokenManager
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    private const val DEFAULT_BASE_URL = "https://backend.vidyadigitalstudio.com/api/v1.0/"

    private var retrofit: Retrofit? = null
    private var apiService: MyStaffApiService? = null

    fun init(context: Context) {
        buildRetrofit()
    }

    private fun buildRetrofit(): Retrofit {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor())
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()

        val baseUrl = TokenManager.getApiUrl(DEFAULT_BASE_URL)
        val formattedBaseUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"

        val instance = Retrofit.Builder()
            .baseUrl(formattedBaseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        retrofit = instance
        apiService = instance.create(MyStaffApiService::class.java)
        return instance
    }

    fun getService(): MyStaffApiService {
        if (apiService == null) {
            buildRetrofit()
        }
        return apiService!!
    }

    fun updateBaseUrl(newUrl: String) {
        TokenManager.saveApiUrl(newUrl)
        buildRetrofit()
    }
}

