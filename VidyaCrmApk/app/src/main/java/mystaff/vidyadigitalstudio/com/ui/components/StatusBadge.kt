package mystaff.vidyadigitalstudio.com.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mystaff.vidyadigitalstudio.com.ui.theme.*

@Composable
fun StatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val normalized = status.lowercase().trim()
    val (bgColor, textColor) = when {
        normalized in listOf("present", "completed", "approved", "paid", "won", "active") -> {
            Color(0xFFECFDF5) to StatusSuccess
        }
        normalized in listOf("absent", "declined", "lost", "overdue", "late", "urgent") -> {
            Color(0xFFFEF2F2) to StatusError
        }
        normalized in listOf("half_day", "pending", "in_progress", "partial", "proposal", "contacted") -> {
            Color(0xFFFFFBEB) to StatusWarning
        }
        else -> {
            Color(0xFFF3F4F6) to TextSecondary
        }
    }

    Text(
        text = status.uppercase().replace("_", " "),
        style = MaterialTheme.typography.labelSmall.copy(
            fontWeight = FontWeight.Bold,
            fontSize = 11.sp,
            color = textColor
        ),
        modifier = modifier
            .background(bgColor, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    )
}

