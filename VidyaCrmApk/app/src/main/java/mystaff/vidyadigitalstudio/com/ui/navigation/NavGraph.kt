package mystaff.vidyadigitalstudio.com.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.*
import mystaff.vidyadigitalstudio.com.ui.components.AppBottomBar
import mystaff.vidyadigitalstudio.com.ui.components.AppTopBar
import mystaff.vidyadigitalstudio.com.ui.screens.attendance.AttendanceScreen
import mystaff.vidyadigitalstudio.com.ui.screens.auth.LoginScreen
import mystaff.vidyadigitalstudio.com.ui.screens.crm.CrmHubScreen
import mystaff.vidyadigitalstudio.com.ui.screens.dashboard.DashboardScreen
import mystaff.vidyadigitalstudio.com.ui.screens.leaves.LeavesScreen
import mystaff.vidyadigitalstudio.com.ui.screens.profile.ProfileScreen
import mystaff.vidyadigitalstudio.com.ui.screens.tasks.TasksScreen
import mystaff.vidyadigitalstudio.com.viewmodel.*

@Composable
fun NavGraph(
    navController: NavHostController,
    authViewModel: AuthViewModel = viewModel(),
    attendanceViewModel: AttendanceViewModel = viewModel(),
    taskViewModel: TaskViewModel = viewModel(),
    crmViewModel: CrmViewModel = viewModel()
) {
    val authState by authViewModel.uiState.collectAsState()
    val attendanceState by attendanceViewModel.uiState.collectAsState()
    val taskState by taskViewModel.uiState.collectAsState()
    val crmState by crmViewModel.uiState.collectAsState()

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Dashboard.route

    if (!authState.isLoggedIn) {
        LoginScreen(
            state = authState,
            onLoginClick = { email, pass -> authViewModel.login(email, pass) },
            onClearError = { authViewModel.clearError() }
        )
    } else {
        Scaffold(
            topBar = {
                AppTopBar(
                    title = when (currentRoute) {
                        Screen.Dashboard.route -> "MyStaff Dashboard"
                        Screen.Attendance.route -> "Studio Attendance"
                        Screen.Tasks.route -> "Tasks & To-Do"
                        Screen.Leaves.route -> "Leaves & Absence"
                        Screen.CrmHub.route -> "CRM Directory"
                        Screen.Profile.route -> "Staff Profile"
                        else -> "MyStaff"
                    },
                    onLogoutClick = { authViewModel.logout() }
                )
            },
            bottomBar = {
                AppBottomBar(
                    currentRoute = currentRoute,
                    onNavigate = { screen ->
                        navController.navigate(screen.route) {
                            popUpTo(Screen.Dashboard.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        ) { paddingValues ->
            NavHost(
                navController = navController,
                startDestination = Screen.Dashboard.route,
                modifier = Modifier.padding(paddingValues)
            ) {
                composable(Screen.Dashboard.route) {
                    DashboardScreen(
                        user = authState.user,
                        todayRecord = attendanceState.todayRecord,
                        pendingTasksCount = taskState.tasks.count { it.status.lowercase() != "completed" },
                        onNavigate = { screen -> navController.navigate(screen.route) },
                        onPunchClick = {
                            if (attendanceState.todayRecord.isPunchIn) {
                                attendanceViewModel.punchOut()
                            } else {
                                attendanceViewModel.punchIn()
                            }
                        }
                    )
                }

                composable(Screen.Attendance.route) {
                    AttendanceScreen(
                        state = attendanceState,
                        onPunchIn = { attendanceViewModel.punchIn() },
                        onPunchOut = { attendanceViewModel.punchOut() },
                        onToggleBreak = { attendanceViewModel.toggleBreak() },
                        onRefresh = { attendanceViewModel.refreshAttendance() }
                    )
                }

                composable(Screen.Tasks.route) {
                    TasksScreen(
                        state = taskState,
                        onFilterChange = { filter -> taskViewModel.setFilter(filter) },
                        onUpdateStatus = { taskId, newStatus -> taskViewModel.updateTaskStatus(taskId, newStatus) },
                        onAddTodo = { text -> taskViewModel.addTodo(text) },
                        onToggleTodo = { id -> taskViewModel.toggleTodo(id) },
                        onDeleteTodo = { id -> taskViewModel.deleteTodo(id) }
                    )
                }

                composable(Screen.Leaves.route) {
                    LeavesScreen(
                        balance = crmState.leaveBalance,
                        leaves = crmState.leaves,
                        onApplyLeave = { type, start, end, reason ->
                            crmViewModel.applyLeave(type, start, end, reason)
                        }
                    )
                }

                composable(Screen.CrmHub.route) {
                    CrmHubScreen(
                        state = crmState,
                        onTabSelected = { index -> crmViewModel.setSelectedTab(index) },
                        onSearchChange = { query -> crmViewModel.setSearchQuery(query) }
                    )
                }

                composable(Screen.Profile.route) {
                    ProfileScreen(
                        user = authState.user,
                        onLogout = { authViewModel.logout() }
                    )
                }
            }
        }
    }
}

