package mystaff.vidyadigitalstudio.com

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.compose.rememberNavController
import mystaff.vidyadigitalstudio.com.ui.navigation.NavGraph
import mystaff.vidyadigitalstudio.com.ui.theme.MyStaffTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MyStaffTheme {
                val navController = rememberNavController()
                NavGraph(navController = navController)
            }
        }
    }
}

