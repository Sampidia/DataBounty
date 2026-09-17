package com.databounty.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.databounty.app.model.BountyTask
import com.databounty.app.model.TaskCategory
import com.databounty.app.model.UserProfile
import com.databounty.app.ui.theme.EmeraldPrimary
import com.databounty.app.ui.theme.TealAccent

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskFeedScreen(
    user: UserProfile,
    tasks: List<BountyTask>,
    onTaskCompleted: (BountyTask, Int) -> Unit
) {
    var selectedTask by remember { mutableStateOf<BountyTask?>(null) }
    var selectedCategoryFilter by remember { mutableStateOf<TaskCategory?>(null) }

    val filteredTasks = tasks.filter { task ->
        val categoryMatch = selectedCategoryFilter == null || task.category == selectedCategoryFilter
        val stateMatch = task.targetState.equals("All", ignoreCase = true) || task.targetState.equals(user.state, ignoreCase = true)
        val genderMatch = task.targetGender.equals("All", ignoreCase = true) || task.targetGender.equals(user.gender, ignoreCase = true)
        categoryMatch && stateMatch && genderMatch
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "DataBounty Task Feed",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = Color.White
                        )
                        Text(
                            text = "Matching: ${user.state} State • ${user.gender}",
                            fontSize = 11.sp,
                            color = EmeraldPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0B0F17)
                )
            )
        },
        containerColor = Color(0xFF0B0F17)
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            
            // Category Filter Chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedCategoryFilter == null,
                    onClick = { selectedCategoryFilter = null },
                    label = { Text("All", fontSize = 12.sp) }
                )
                FilterChip(
                    selected = selectedCategoryFilter == TaskCategory.GOOGLE_FORM,
                    onClick = { selectedCategoryFilter = TaskCategory.GOOGLE_FORM },
                    label = { Text("Google Forms", fontSize = 12.sp) }
                )
                FilterChip(
                    selected = selectedCategoryFilter == TaskCategory.APP_TEST,
                    onClick = { selectedCategoryFilter = TaskCategory.APP_TEST },
                    label = { Text("App Tests", fontSize = 12.sp) }
                )
                FilterChip(
                    selected = selectedCategoryFilter == TaskCategory.WEB_BUG,
                    onClick = { selectedCategoryFilter = TaskCategory.WEB_BUG },
                    label = { Text("Web Bugs", fontSize = 12.sp) }
                )
            }

            // Tasks List
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(filteredTasks) { task ->
                    TaskCardItem(
                        task = task,
                        user = user,
                        onClick = { selectedTask = task }
                    )
                }
            }
        }

        // Task Detail & Submission Dialog
        selectedTask?.let { task ->
            TaskDetailDialog(
                task = task,
                onDismiss = { selectedTask = null },
                onSubmit = {
                    onTaskCompleted(task, task.rewardPerUser)
                    selectedTask = null
                }
            )
        }
    }
}

@Composable
fun TaskCardItem(
    task: BountyTask,
    user: UserProfile,
    onClick: () -> Unit
) {
    val progress = (task.completedSpots.toFloat() / task.totalSpots.toFloat()).coerceIn(0f, 1f)
    val isEligible = (task.targetState.equals("All", ignoreCase = true) || task.targetState.equals(user.state, ignoreCase = true)) &&
            (task.targetGender.equals("All", ignoreCase = true) || task.targetGender.equals(user.gender, ignoreCase = true))

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = isEligible, onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1F2937))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = Color(0xFF1F2937),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = task.category.name.replace("_", " "),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = TealAccent,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                Text(
                    text = "₦${task.rewardPerUser}",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = EmeraldPrimary
                )
            }

            Text(
                text = task.title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Text(
                text = task.description,
                fontSize = 12.sp,
                color = Color.Gray,
                maxLines = 2
            )

            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Surface(
                    color = Color(0xFF0B0F17),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = "📍 ${if (task.targetState == "All") "All 36 States + FCT" else task.targetState}",
                        fontSize = 10.sp,
                        color = Color.LightGray,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }

                Surface(
                    color = Color(0xFF0B0F17),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = "👤 ${if (task.targetGender == "All") "All Genders" else task.targetGender}",
                        fontSize = 10.sp,
                        color = Color.LightGray,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            // Spots Progress
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Spots: ${task.completedSpots} / ${task.totalSpots}",
                        fontSize = 11.sp,
                        color = Color.Gray
                    )
                    Text(
                        text = "${(progress * 100).toInt()}%",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = EmeraldPrimary
                    )
                }

                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = EmeraldPrimary,
                    trackColor = Color(0xFF1F2937)
                )
            }
        }
    }
}

@Composable
fun TaskDetailDialog(
    task: BountyTask,
    onDismiss: () -> Unit,
    onSubmit: () -> Unit
) {
    var proofInput by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF111827),
        title = {
            Column {
                Text(
                    text = task.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = Color.White
                )
                Text(
                    text = "Bounty Reward: ₦${task.rewardPerUser}",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = EmeraldPrimary
                )
            }
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Instructions:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = task.testInstructions,
                    fontSize = 11.sp,
                    color = Color.LightGray
                )

                OutlinedTextField(
                    value = proofInput,
                    onValueChange = { proofInput = it },
                    label = { Text("Proof Screenshot URL / Notes", fontSize = 11.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onSubmit,
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
            ) {
                Text("Submit & Earn ₦${task.rewardPerUser}", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Color.Gray)
            }
        }
    )
}
