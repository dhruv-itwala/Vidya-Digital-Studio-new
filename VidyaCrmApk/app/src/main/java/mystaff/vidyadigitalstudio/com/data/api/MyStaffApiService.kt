package mystaff.vidyadigitalstudio.com.data.api

import mystaff.vidyadigitalstudio.com.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface MyStaffApiService {

    // --- Authentication & User ---
    @POST("users/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("users/me")
    suspend fun getProfile(): Response<ProfileResponse>

    // --- Attendance & Punch ---
    @GET("attendance/wifi-check")
    suspend fun checkWifi(): Response<WifiCheckResponse>

    @GET("attendance/work-record/today")
    suspend fun getTodayRecord(): Response<TodayRecordResponse>

    @POST("attendance/punch-in")
    suspend fun punchIn(): Response<PunchResponse>

    @POST("attendance/punch-out")
    suspend fun punchOut(): Response<PunchResponse>

    @POST("attendance/break-in")
    suspend fun breakIn(): Response<PunchResponse>

    @POST("attendance/break-out")
    suspend fun breakOut(): Response<PunchResponse>

    @GET("attendance/my")
    suspend fun getMyAttendance(): Response<AttendanceHistoryResponse>

    // --- Tasks & Todo ---
    @GET("tasks")
    suspend fun getTasks(): Response<TaskListResponse>

    @PATCH("tasks/{id}")
    suspend fun updateTaskStatus(
        @Path("id") id: String,
        @Body request: UpdateTaskStatusRequest
    ): Response<PunchResponse>

    @GET("todo")
    suspend fun getTodoList(): Response<TodoListResponse>

    @POST("todo")
    suspend fun createTodo(@Body request: CreateTodoRequest): Response<PunchResponse>

    @PATCH("todo/{id}/toggle")
    suspend fun toggleTodo(@Path("id") id: String): Response<PunchResponse>

    @DELETE("todo/{id}")
    suspend fun deleteTodo(@Path("id") id: String): Response<PunchResponse>

    // --- Leaves ---
    @GET("leave/balance")
    suspend fun getLeaveBalance(): Response<LeaveBalanceResponse>

    @GET("leave/my")
    suspend fun getMyLeaves(): Response<LeaveListResponse>

    @POST("leave/apply")
    suspend fun applyLeave(@Body request: ApplyLeaveRequest): Response<PunchResponse>

    // --- CRM: Clients, Leads, Invoices, Holidays ---
    @GET("clients")
    suspend fun getClients(): Response<ClientListResponse>

    @GET("leads")
    suspend fun getLeads(): Response<LeadListResponse>

    @GET("invoice")
    suspend fun getInvoices(): Response<InvoiceListResponse>

    @GET("holiday/employee")
    suspend fun getHolidays(): Response<HolidayListResponse>
}

