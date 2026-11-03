package mystaff.vidyadigitalstudio.com.ui.screens.tasks

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mystaff.vidyadigitalstudio.com.data.models.TaskDto
import mystaff.vidyadigitalstudio.com.data.models.TodoDto
import mystaff.vidyadigitalstudio.com.ui.components.StatusBadge
import mystaff.vidyadigitalstudio.com.ui.theme.*
import mystaff.vidyadigitalstudio.com.viewmodel.TaskUiState

@Composable
fun TasksScreen(
    state: TaskUiState,
    onFilterChange: (String) -> Unit,
    onUpdateStatus: (String, String) -> Unit,
    onAddTodo: (String) -> Unit,
    onToggleTodo: (String) -> Unit,
    onDeleteTodo: (String) -> Unit
) {
    var newTodoText by remember { mutableStateOf("") }
    val filters = listOf("ALL", "PENDING", "IN_PROGRESS", "COMPLETED")

    val filteredTasks = remember(state.tasks, state.selectedFilter) {
        if (state.selectedFilter == "ALL") {
            state.tasks
        } else {
            state.tasks.filter { it.status.equals(state.selectedFilter, ignoreCase = true) }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Filter Tabs
        item {
            ScrollableTabRow(
                selectedTabIndex = filters.indexOf(state.selectedFilter).coerceAtLeast(0),
                containerColor = SurfaceWhite,
                contentColor = BrandPrimary,
                edgePadding = 0.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                filters.forEach { filter ->
                    Tab(
                        selected = state.selectedFilter == filter,
                        onClick = { onFilterChange(filter) },
                        text = {
                            Text(
                                text = filter.replace("_", " "),
                                fontWeight = if (state.selectedFilter == filter) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    )
                }
            }
        }

        // Assigned Tasks Header
        item {
            Text(
                text = "Assigned Tasks (${filteredTasks.size})",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
        }

        // Task Cards
        if (filteredTasks.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, CardBorder)
                ) {
                    Text(
                        text = "No tasks found in this view.",
                        style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary),
                        modifier = Modifier.padding(20.dp)
                    )
                }
            }
        } else {
            items(filteredTasks) { task ->
                TaskCard(task = task, onStatusChange = { newStatus -> onUpdateStatus(task.id, newStatus) })
            }
        }

        // Personal To-Do Checklist Header
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = "Personal To-Do Checklist",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
        }

        // Add Todo Input Field
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = newTodoText,
                    onValueChange = { newTodoText = it },
                    placeholder = { Text("Add daily to-do item...") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = {
                        if (newTodoText.isNotBlank()) {
                            onAddTodo(newTodoText)
                            newTodoText = ""
                        }
                    },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary)
                ) {
                    Text("Add")
                }
            }
        }

        // Todo Items
        items(state.todos) { todo ->
            TodoCard(todo = todo, onToggle = { onToggleTodo(todo.id) }, onDelete = { onDeleteTodo(todo.id) })
        }
    }
}

@Composable
fun TaskCard(
    task: TaskDto,
    onStatusChange: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                StatusBadge(status = task.priority)
                StatusBadge(status = task.status)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = task.title,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )

            task.description?.let { desc ->
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = desc,
                    style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary),
                    maxLines = 2
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (task.status.lowercase() != "completed") {
                    TextButton(onClick = { onStatusChange("in_progress") }) {
                        Text("Start", color = BrandPrimary)
                    }
                    Button(
                        onClick = { onStatusChange("completed") },
                        shape = RoundedCornerShape(6.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = StatusSuccess)
                    ) {
                        Text("Mark Done", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun TodoCard(
    todo: TodoDto,
    onToggle: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = todo.isCompleted,
                onCheckedChange = { onToggle() },
                colors = CheckboxDefaults.colors(checkedColor = BrandPrimary)
            )
            Text(
                text = todo.title,
                style = MaterialTheme.typography.bodyMedium.copy(
                    textDecoration = if (todo.isCompleted) TextDecoration.LineThrough else null,
                    color = if (todo.isCompleted) TextMuted else TextPrimary
                ),
                modifier = Modifier.weight(1f)
            )
            IconButton(onClick = onDelete) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Delete",
                    tint = TextMuted,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

