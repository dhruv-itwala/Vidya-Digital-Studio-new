package mystaff.vidyadigitalstudio.com.ui.components

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import mystaff.vidyadigitalstudio.com.ui.navigation.Screen
import mystaff.vidyadigitalstudio.com.ui.navigation.bottomNavScreens
import mystaff.vidyadigitalstudio.com.ui.theme.BrandPrimary
import mystaff.vidyadigitalstudio.com.ui.theme.SurfaceWhite
import mystaff.vidyadigitalstudio.com.ui.theme.TextMuted

@Composable
fun AppBottomBar(
    currentRoute: String,
    onNavigate: (Screen) -> Unit
) {
    NavigationBar(
        containerColor = SurfaceWhite,
        tonalElevation = 8.dp
    ) {
        bottomNavScreens.forEach { screen ->
            val isSelected = currentRoute == screen.route
            NavigationBarItem(
                selected = isSelected,
                onClick = { onNavigate(screen) },
                icon = {
                    screen.icon?.let {
                        Icon(
                            imageVector = it,
                            contentDescription = screen.title
                        )
                    }
                },
                label = { Text(screen.title) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = BrandPrimary,
                    selectedTextColor = BrandPrimary,
                    indicatorColor = Color(0xFFECFDF5),
                    unselectedIconColor = TextMuted,
                    unselectedTextColor = TextMuted
                )
            )
        }
    }
}

