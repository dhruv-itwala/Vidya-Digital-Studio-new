package mystaff.vidyadigitalstudio.com

import mystaff.vidyadigitalstudio.com.data.models.*
import org.junit.Assert.*
import org.junit.Test

class MyStaffUnitTest {

    @Test
    fun loginRequest_createsCorrectJsonPayload() {
        val request = LoginRequest("test@vidyadigitalstudio.com", "password123")
        assertEquals("test@vidyadigitalstudio.com", request.email)
        assertEquals("password123", request.password)
    }

    @Test
    fun userDto_defaultsAreSafeAndPopulated() {
        val user = UserDto(
            id = "user_01",
            name = "Test Staff",
            email = "staff@vidyadigitalstudio.com",
            role = "employee",
            designation = "Lead Photographer"
        )
        assertEquals("user_01", user.id)
        assertEquals("Test Staff", user.name)
        assertEquals("employee", user.role)
        assertTrue(user.requireOfficeWifi)
    }

    @Test
    fun todayRecordDto_computesStatusProperly() {
        val record = TodayRecordDto(
            date = "2026-11-03",
            workMinutes = 480,
            status = "PRESENT",
            isPunchIn = true
        )
        assertEquals(480, record.workMinutes)
        assertEquals("PRESENT", record.status)
        assertTrue(record.isPunchIn)
    }

    @Test
    fun taskDto_defaultsToPendingStatus() {
        val task = TaskDto(
            id = "task_01",
            title = "Edit Wedding Album",
            priority = "high",
            status = "pending"
        )
        assertEquals("pending", task.status)
        assertEquals("high", task.priority)
    }

    @Test
    fun leaveBalanceDto_handlesTotalCalculation() {
        val balance = LeaveBalanceDto(
            casualLeave = 5,
            sickLeave = 4,
            paidLeave = 10,
            totalRemaining = 19
        )
        assertEquals(19, balance.totalRemaining)
    }
}

