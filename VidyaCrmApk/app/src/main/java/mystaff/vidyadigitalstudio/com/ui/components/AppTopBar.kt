package mystaff.vidyadigitalstudio.com.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mystaff.vidyadigitalstudio.com.R
import mystaff.vidyadigitalstudio.com.ui.theme.BrandPrimary
import mystaff.vidyadigitalstudio.com.ui.theme.SurfaceWhite

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppTopBar(
    title: String,
    onLogoutClick: (() -> Unit)? = null
) {
    TopAppBar(
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.green_logo),
                    contentDescription = "MyStaff Logo",
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                )
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium.copy(
                            color = SurfaceWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    )
                    Text(
                        text = "Vidya Digital Studio",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = Color(0xFFD1FAE5),
                            fontSize = 11.sp
                        )
                    )
                }
            }
        },
        actions = {
            onLogoutClick?.let {
                IconButton(onClick = it) {
                    Icon(
                        imageVector = Icons.Default.ExitToApp,
                        contentDescription = "Logout",
                        tint = SurfaceWhite
                    )
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = BrandPrimary,
            titleContentColor = SurfaceWhite
        )
    )
}

