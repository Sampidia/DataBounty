package com.databounty.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.databounty.app.model.TaskSubmission
import com.databounty.app.ui.theme.EmeraldPrimary
import com.databounty.app.ui.theme.TealAccent

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatorReviewScreen(
    submissions: List<TaskSubmission>,
    creatorTaskIds: List<String> = emptyList(),
    onApproveSubmission: (String) -> Unit,
    onRejectSubmission: (String, String) -> Unit
) {
    var rejectingSub by remember { mutableStateOf<TaskSubmission?>(null) }
    var rejectionReasonInput by remember { mutableStateOf("") }

    val filteredSubmissions = if (creatorTaskIds.isNotEmpty()) {
        submissions.filter { creatorTaskIds.contains(it.taskId) }
    } else {
        submissions
    }
    val option2Submissions = filteredSubmissions.filter { it.secretCode != null || it.status == "pending" }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Option 2 Creator Manual Review",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = Color.White
                        )
                        Text(
                            text = "Verify secret codes & approve tester payouts",
                            fontSize = 11.sp,
                            color = TealAccent
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0B0F17))
            )
        },
        containerColor = Color(0xFF0B0F17)
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            
            Surface(
                color = Color(0xFF111827),
                shape = RoundedCornerShape(12.dp)
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
                            text = "Option 2 Submission Queue",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color.White
                        )
                        Text(
                            text = "${option2Submissions.size} submissions requiring manual verification",
                            fontSize = 11.sp,
                            color = Color.Gray
                        )
                    }
                }
            }

            if (option2Submissions.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(150.dp)
                        .background(Color(0xFF111827), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No Option 2 submissions pending manual review.",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(option2Submissions) { sub ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = sub.userName,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = Color.White
                                    )
                                    Text(
                                        text = "₦${sub.rewardAmount}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = EmeraldPrimary
                                    )
                                }

                                Text(
                                    text = sub.taskTitle,
                                    fontSize = 12.sp,
                                    color = Color.LightGray
                                )

                                // Secret Code Badge
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Secret Code:",
                                        fontSize = 11.sp,
                                        color = Color.Gray
                                    )
                                    Surface(
                                        color = Color(0xFF031F51),
                                        shape = RoundedCornerShape(6.dp),
                                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF029FFC))
                                    ) {
                                        Text(
                                            text = sub.secretCode ?: "No code",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace,
                                            color = Color(0xFF029FFC),
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }
                                }

                                if (!sub.proofUrl.isNull_or_empty()) {
                                    Text(
                                        text = "Proof: ${sub.proofUrl}",
                                        fontSize = 11.sp,
                                        color = TealAccent
                                    )
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    if (sub.status == "pending" || sub.status == "pending_verification") {
                                        Button(
                                            onClick = { onApproveSubmission(sub.id) },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                                        ) {
                                            Text("Approve Payout", fontSize = 11.sp, color = Color.Black, fontWeight = FontWeight.Bold)
                                        }

                                        Button(
                                            onClick = {
                                                rejectingSub = sub
                                                rejectionReasonInput = ""
                                            },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                                        ) {
                                            Text("Reject", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                                        }
                                    } else {
                                        Text(
                                            text = "Status: ${sub.status.uppercase()}",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (sub.status == "approved") EmeraldPrimary else Color.Red
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Rejection Reason Dialog
    rejectingSub?.let { sub ->
        AlertDialog(
            onDismissRequest = { rejectingSub = null },
            title = {
                Text(
                    text = "Reject Submission",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = Color.White
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Rejecting submission by ${sub.userName} for task: ${sub.taskTitle}",
                        fontSize = 12.sp,
                        color = Color.LightGray
                    )
                    OutlinedTextField(
                        value = rejectionReasonInput,
                        onValueChange = { rejectionReasonInput = it },
                        label = { Text("Reason for Rejection *") },
                        placeholder = { Text("e.g. Invalid secret code") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color(0xFF111827),
                            unfocusedContainerColor = Color(0xFF111827),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (rejectionReasonInput.isNotBlank()) {
                            onRejectSubmission(sub.id, rejectionReasonInput.trim())
                            rejectingSub = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                    enabled = rejectionReasonInput.isNotBlank()
                ) {
                    Text("Confirm Rejection", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { rejectingSub = null }) {
                    Text("Cancel", color = Color.Gray)
                }
            },
            containerColor = Color(0xFF031F51)
        )
    }
}

private fun String?.isNull_or_empty(): Boolean {
    return this == null || this.isEmpty()
}
