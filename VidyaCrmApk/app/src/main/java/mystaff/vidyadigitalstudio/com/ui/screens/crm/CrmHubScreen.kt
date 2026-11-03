package mystaff.vidyadigitalstudio.com.ui.screens.crm

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mystaff.vidyadigitalstudio.com.data.models.*
import mystaff.vidyadigitalstudio.com.ui.components.StatusBadge
import mystaff.vidyadigitalstudio.com.ui.theme.*
import mystaff.vidyadigitalstudio.com.viewmodel.CrmUiState

@Composable
fun CrmHubScreen(
    state: CrmUiState,
    onTabSelected: (Int) -> Unit,
    onSearchChange: (String) -> Unit
) {
    val tabs = listOf("Clients", "Leads", "Invoices", "Holidays")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        // Tab Row
        TabRow(
            selectedTabIndex = state.selectedTab,
            containerColor = SurfaceWhite,
            contentColor = BrandPrimary
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = state.selectedTab == index,
                    onClick = { onTabSelected(index) },
                    text = {
                        Text(
                            text = title,
                            fontWeight = if (state.selectedTab == index) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                )
            }
        }

        // Search Bar
        OutlinedTextField(
            value = state.searchQuery,
            onValueChange = onSearchChange,
            placeholder = { Text("Search ${tabs[state.selectedTab]}...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            shape = RoundedCornerShape(10.dp)
        )

        // Tab Content
        when (state.selectedTab) {
            0 -> ClientsTab(clients = state.clients, query = state.searchQuery)
            1 -> LeadsTab(leads = state.leads, query = state.searchQuery)
            2 -> InvoicesTab(invoices = state.invoices, query = state.searchQuery)
            3 -> HolidaysTab(holidays = state.holidays)
        }
    }
}

@Composable
fun ClientsTab(clients: List<ClientDto>, query: String) {
    val filtered = clients.filter {
        it.name.contains(query, ignoreCase = true) ||
        it.companyName?.contains(query, ignoreCase = true) == true
    }

    if (filtered.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No clients found", color = TextSecondary)
        }
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(filtered) { client ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, CardBorder)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(client.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        client.companyName?.let {
                            Text(it, style = MaterialTheme.typography.bodySmall.copy(color = BrandPrimary, fontWeight = FontWeight.Medium))
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        client.phone?.let {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Phone, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(it, style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LeadsTab(leads: List<LeadDto>, query: String) {
    val filtered = leads.filter { it.clientName.contains(query, ignoreCase = true) }

    if (filtered.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No leads recorded", color = TextSecondary)
        }
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(filtered) { lead ->
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
                            Text(lead.clientName, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                            lead.service?.let {
                                Text("Service: $it", style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary))
                            }
                            lead.budget?.let {
                                Text("Budget: ₹${it.toInt()}", style = MaterialTheme.typography.bodySmall.copy(color = BrandPrimary, fontWeight = FontWeight.Bold))
                            }
                        }
                        StatusBadge(status = lead.status)
                    }
                }
            }
        }
    }
}

@Composable
fun InvoicesTab(invoices: List<InvoiceDto>, query: String) {
    val filtered = invoices.filter {
        it.invoiceNumber.contains(query, ignoreCase = true) ||
        it.clientName.contains(query, ignoreCase = true)
    }

    if (filtered.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No invoices found", color = TextSecondary)
        }
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(filtered) { invoice ->
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
                            Text(invoice.invoiceNumber, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                            Text(invoice.clientName, style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary))
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Total: ₹${invoice.totalAmount.toInt()} | Balance: ₹${invoice.balanceAmount.toInt()}", style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold))
                        }
                        StatusBadge(status = invoice.status)
                    }
                }
            }
        }
    }
}

@Composable
fun HolidaysTab(holidays: List<HolidayDto>) {
    if (holidays.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No upcoming declared holidays", color = TextSecondary)
        }
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(holidays) { holiday ->
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
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Celebration, contentDescription = null, tint = BrandPrimary, modifier = Modifier.size(28.dp))
                        Spacer(modifier = Modifier.width(14.dp))
                        Column {
                            Text(holiday.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                            Text(holiday.date, style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary))
                        }
                    }
                }
            }
        }
    }
}

