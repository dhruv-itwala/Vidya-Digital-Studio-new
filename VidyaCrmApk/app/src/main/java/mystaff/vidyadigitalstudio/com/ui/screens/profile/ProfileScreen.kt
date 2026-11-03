package mystaff.vidyadigitalstudio.com.ui.screens.profile

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mystaff.vidyadigitalstudio.com.data.models.UserDto
import mystaff.vidyadigitalstudio.com.ui.theme.*

@Composable
fun ProfileScreen(
    user: UserDto?,
    onLogout: () -> Unit
) {
    var showLogoutDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterVertically
    ) {
        Spacer(modifier = Modifier.height(10.dp))

        // Staff Avatar
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
                .background(BrandPrimary),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = user?.name?.take(1)?.uppercase() ?: "S",
                style = MaterialTheme.typography.headlineLarge.copy(
                    color = SurfaceWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 32.sp
                )
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = user?.name ?: "Staff Member",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
        )
        Text(
            text = user?.email ?: "email@vidyadigitalstudio.com",
            style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary)
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Profile Details Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            border = BorderStroke(1.dp, CardBorder)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                ProfileRow(icon = Icons.Default.Badge, label = "Designation", value = user?.designation ?: "Staff")
                Divider(modifier = Modifier.padding(vertical = 10.dp), color = CardBorder)
                ProfileRow(icon = Icons.Default.Category, label = "Department", value = user?.department ?: "Production")
                Divider(modifier = Modifier.padding(vertical = 10.dp), color = CardBorder)
                ProfileRow(icon = Icons.Default.Shield, label = "Role", value = user?.role?.uppercase() ?: "EMPLOYEE")
                Divider(modifier = Modifier.padding(vertical = 10.dp), color = CardBorder)
                ProfileRow(
                    icon = Icons.Default.Wifi,
                    label = "Wi-Fi Punch Rule",
                    value = if (user?.requireOfficeWifi == false) "WFH Allowed" else "Studio Wi-Fi Enforced"
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Server API Connection Info
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            border = BorderStroke(1.dp, CardBorder)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "System Information",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "API Base: https://backend.vidyadigitalstudio.com/api/v1.0",
                    style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary)
                )
                Text(
                    text = "App Version: 1.3.90 (Native Kotlin)",
                    style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary)
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Logout Button
        Button(
            onClick = { showLogoutDialog = true },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(containerColor = StatusError)
        ) {
            Icon(Icons.Default.Logout, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Sign Out of MyStaff", fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(16.dp))
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Confirm Sign Out") },
            text = { Text("Are you sure you want to log out of MyStaff on this device?") },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        onLogout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = StatusError)
                ) {
                    Text("Sign Out")
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }
}

@Composable
fun ProfileRow(icon: ImageVector, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(imageVector = icon, contentDescription = null, tint = BrandPrimary, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(10.dp))
            Text(text = label, style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary))
        }
        Text(text = value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
    }
}

