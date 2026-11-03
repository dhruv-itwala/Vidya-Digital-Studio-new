package mystaff.vidyadigitalstudio.com

import android.app.Application
import mystaff.vidyadigitalstudio.com.data.api.ApiClient
import mystaff.vidyadigitalstudio.com.data.local.TokenManager

class MyStaffApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // Initialize token manager with application context
        TokenManager.init(this)
        // Initialize API client
        ApiClient.init(this)
    }
}

