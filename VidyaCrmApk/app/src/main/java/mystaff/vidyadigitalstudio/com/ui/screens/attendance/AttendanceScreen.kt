package mystaff.vidyadigitalstudio.com.ui.screens.attendance

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mystaff.vidyadigitalstudio.com.data.models.TodayRecordDto
import mystaff.vidyadigitalstudio.com.ui.components.StatusBadge
import mystaff.vidyadigitalstudio.com.ui.theme.*
import mystaff.vidyadigitalstudio.com.viewmodel.AttendanceUiState

@Composable
fun AttendanceScreen(
    state: AttendanceUiState,
    onPunchIn: () -> Unit,
    onPunchOut: () -> Unit,
    onToggleBreak: () -> Unit,
    onRefresh: () -> Unit
) {
    val record = state.todayRecord

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Studio Wi-Fi / IP Verification Pill
        item {
            Card(
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (state.isOnOfficeWifi) Color(0xFFECFDF5) else Color(0xFFFFFBEB)
                ),
                border = BorderStroke(
                    1.dp,
                    if (state.isOnOfficeWifi) Color(0xFFA7F3D0) else Color(0xFFFDE68A)
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (state.isOnOfficeWifi) Icons.Default.Wifi else Icons.Default.WifiOff,
                        contentDescription = "Wi-Fi status",
                        tint = if (state.isOnOfficeWifi) BrandPrimary else StatusWarning
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = if (state.isOnOfficeWifi) "Connected to Studio Network" else "Outside Studio Wi-Fi (Rules Apply)",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Medium,
                            color = if (state.isOnOfficeWifi) BrandPrimary else Color(0xFFB45309)
                        )
                    )
                }
            }
        }

        // Live Action Punch Widget
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorder)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Today's Work Session",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    StatusBadge(status = record.status ?: if (record.isPunchIn) "PRESENT" else "NOT PUNCHED")

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "${record.workMinutes} Minutes",
                        style = MaterialTheme.typography.headlineLarge.copy(
                            color = BrandPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 36.sp
                        )
                    )
                    Text(
                        text = "Total Active Working Time",
                        style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary)
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    // Punch Action Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = { if (record.isPunchIn) onPunchOut() else onPunchIn() },
                            enabled = !state.isLoading,
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (record.isPunchIn) StatusError else BrandPrimary
                            )
                        ) {
                            Text(
                                text = if (record.isPunchIn) "Punch Out" else "Punch In",
                                fontWeight = FontWeight.Bold
                            )
                        }

                        if (record.isPunchIn) {
                            OutlinedButton(
                                onClick = onToggleBreak,
                                enabled = !state.isLoading,
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp),
                                shape = RoundedCornerShape(10.dp),
                                border = BorderStroke(1.dp, StatusWarning),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = Color(0xFFB45309)
                                )
                            ) {
                                Text(
                                    text = if (record.isOnBreak) "End Break" else "Take Break",
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }

        // Attendance History Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Attendance History",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                IconButton(onClick = onRefresh) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh",
                        tint = BrandPrimary
                    )
                }
            }
        }

        // Attendance History Items
        if (state.history.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, CardBorder)
                ) {
                    Text(
                        text = "No attendance logs recorded for this period.",
                        style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary),
                        modifier = Modifier.padding(20.dp)
                    )
                }
            }
        } else {
            items(state.history) { itemRecord ->
                AttendanceItemCard(itemRecord)
            }
        }
    }
}

@Composable
fun AttendanceItemCard(record: TodayRecordDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = record.date ?: "Session",
                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "In: ${record.punchIn?.substringAfter("T")?.take(5) ?: "--:--"} | Out: ${record.punchOut?.substringAfter("T")?.take(5) ?: "--:--"}",
                    style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary)
                )
            }
            StatusBadge(status = record.status ?: "PRESENT")
        }
    }
}

