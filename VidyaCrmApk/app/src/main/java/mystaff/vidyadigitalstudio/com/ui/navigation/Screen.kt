package mystaff.vidyadigitalstudio.com.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector? = null) {
    object Login : Screen("login", "Login")
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Dashboard)
    object Attendance : Screen("attendance", "Attendance", Icons.Default.AccessTime)
    object Tasks : Screen("tasks", "Tasks", Icons.Default.Checklist)
    object Leaves : Screen("leaves", "Leaves", Icons.Default.DateRange)
    object CrmHub : Screen("crm", "CRM", Icons.Default.Business)
    object Profile : Screen("profile", "Profile", Icons.Default.Person)
}

val bottomNavScreens = listOf(
    Screen.Dashboard,
    Screen.Attendance,
    Screen.Tasks,
    Screen.CrmHub,
    Screen.Profile
)

