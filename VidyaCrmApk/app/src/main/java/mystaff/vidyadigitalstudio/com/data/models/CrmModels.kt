package mystaff.vidyadigitalstudio.com.data.models

import com.google.gson.annotations.SerializedName

data class ClientListResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: List<ClientDto> = emptyList()
)

data class ClientDto(
    @SerializedName("_id") val id: String = "",
    @SerializedName("name") val name: String = "",
    @SerializedName("companyName") val companyName: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("address") val address: String? = null,
    @SerializedName("status") val status: String? = "active"
)

data class LeadListResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: List<LeadDto> = emptyList()
)

data class LeadDto(
    @SerializedName("_id") val id: String = "",
    @SerializedName("clientName") val clientName: String = "",
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("service") val service: String? = null,
    @SerializedName("status") val status: String = "new", // new, contacted, proposal, won, lost
    @SerializedName("budget") val budget: Double? = null,
    @SerializedName("notes") val notes: String? = null
)

data class InvoiceListResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: List<InvoiceDto> = emptyList()
)

data class InvoiceDto(
    @SerializedName("_id") val id: String = "",
    @SerializedName("invoiceNumber") val invoiceNumber: String = "",
    @SerializedName("clientName") val clientName: String = "",
    @SerializedName("totalAmount") val totalAmount: Double = 0.0,
    @SerializedName("paidAmount") val paidAmount: Double = 0.0,
    @SerializedName("balanceAmount") val balanceAmount: Double = 0.0,
    @SerializedName("status") val status: String = "pending", // paid, partial, pending
    @SerializedName("invoiceDate") val invoiceDate: String? = null,
    @SerializedName("dueDate") val dueDate: String? = null
)

data class HolidayListResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: List<HolidayDto> = emptyList()
)

data class HolidayDto(
    @SerializedName("_id") val id: String = "",
    @SerializedName("name") val name: String = "",
    @SerializedName("date") val date: String = "",
    @SerializedName("description") val description: String? = null
)

