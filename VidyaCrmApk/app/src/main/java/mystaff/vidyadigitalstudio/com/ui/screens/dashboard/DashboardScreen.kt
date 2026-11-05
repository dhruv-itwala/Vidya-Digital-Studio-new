package mystaff.vidyadigitalstudio.com.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import mystaff.vidyadigitalstudio.com.data.models.TodayRecordDto
import mystaff.vidyadigitalstudio.com.data.models.UserDto
import mystaff.vidyadigitalstudio.com.ui.components.StatCard
import mystaff.vidyadigitalstudio.com.ui.components.StatusBadge
import mystaff.vidyadigitalstudio.com.ui.navigation.Screen
import mystaff.vidyadigitalstudio.com.ui.theme.*

@Composable
fun DashboardScreen(
    user: UserDto?,
    todayRecord: TodayRecordDto,
    pendingTasksCount: Int,
    onNavigate: (Screen) -> Unit,
    onPunchClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Staff Greeting Banner
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = BrandPrimary)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(54.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF1B8764)),
                    contentAlignment = Alignment.Center
                ) {
                    if (!user?.avatarUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = user!!.avatarUrl,
                            contentDescription = "Profile Photo",
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Text(
                            text = user?.name?.take(1)?.uppercase() ?: "S",
                            style = MaterialTheme.typography.titleLarge.copy(
                                color = SurfaceWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 24.sp
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Hello, ${user?.name ?: "Staff"}!",
                        style = MaterialTheme.typography.titleLarge.copy(
                            color = SurfaceWhite,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${user?.designation ?: "Team Member"} • ${user?.role?.uppercase() ?: "STAFF"}",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = Color(0xFFD1FAE5),
                            fontSize = 12.sp
                        )
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Quick Attendance & Punch Action Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Today's Attendance",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    StatusBadge(status = todayRecord.status ?: "NOT PUNCHED")
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Punch In", style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary))
                        Text(
                            text = todayRecord.punchIn?.substringAfter("T")?.take(5) ?: "--:--",
                            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold)
                        )
                    }
                    Column {
                        Text("Punch Out", style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary))
                        Text(
                            text = todayRecord.punchOut?.substringAfter("T")?.take(5) ?: "--:--",
                            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold)
                        )
                    }
                    Column {
                        Text("Duration", style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary))
                        Text(
                            text = "${todayRecord.workMinutes}m",
                            style = MaterialTheme.typography.bodyLarge.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = BrandPrimary
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onPunchClick,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (todayRecord.isPunchIn) StatusError else BrandPrimary
                    )
                ) {
                    Icon(
                        imageVector = if (todayRecord.isPunchIn) Icons.Default.Logout else Icons.Default.Login,
                        contentDescription = null
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (todayRecord.isPunchIn) "Punch Out Now" else "Punch In to Studio",
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // High Level Metric Cards
        Text(
            text = "Studio Overview",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            modifier = Modifier.padding(vertical = 4.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Pending Tasks",
                value = "$pendingTasksCount Active",
                icon = Icons.Default.Assignment,
                iconTint = StatusWarning,
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigate(Screen.Tasks) }
            )
            StatCard(
                title = "Quick Leaves",
                value = "Apply / View",
                icon = Icons.Default.EventNote,
                iconTint = BrandPrimary,
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigate(Screen.Leaves) }
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Clients CRM",
                value = "Directory",
                icon = Icons.Default.People,
                iconTint = StatusInfo,
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigate(Screen.CrmHub) }
            )
            StatCard(
                title = "My Profile",
                value = "Identity",
                icon = Icons.Default.AccountCircle,
                iconTint = BrandPrimaryVariant,
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigate(Screen.Profile) }
            )
        }
    }
}

