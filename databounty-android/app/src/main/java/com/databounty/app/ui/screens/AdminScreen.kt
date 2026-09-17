package com.databounty.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.databounty.app.model.WithdrawalRequest
import com.databounty.app.model.WithdrawalStatus
import com.databounty.app.model.findBankByTag
import com.databounty.app.ui.theme.EmeraldPrimary
import com.databounty.app.ui.theme.TealAccent

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    withdrawals: List<WithdrawalRequest>,
    onStatusChanged: (String, WithdrawalStatus) -> Unit,
    onBatchStatusChanged: (List<String>, WithdrawalStatus) -> Unit = { _, _ -> }
) {
    val pendingCount = withdrawals.count { it.status == WithdrawalStatus.PENDING }
    val processingCount = withdrawals.count { it.status == WithdrawalStatus.PROCESSING }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Admin Payout & Disbursement Suite",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = Color.White
                    )
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
            
            // Header Batch Control Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Batch Payout Operations",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = Color.White
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Download Withdraw Requests (CSV) Button - Only PENDING
                        Button(
                            onClick = {
                                val pendingIds = withdrawals.filter { it.status == WithdrawalStatus.PENDING }.map { it.id }
                                if (pendingIds.isNotEmpty()) {
                                    onBatchStatusChanged(pendingIds, WithdrawalStatus.PROCESSING)
                                }
                            },
                            enabled = pendingCount > 0,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF025BE5))
                        ) {
                            Text("Download CSV ($pendingCount Pending)", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                        }

                        // Change All Processing to Paid / Completed Button
                        Button(
                            onClick = {
                                val processingIds = withdrawals.filter { it.status == WithdrawalStatus.PROCESSING }.map { it.id }
                                if (processingIds.isNotEmpty()) {
                                    onBatchStatusChanged(processingIds, WithdrawalStatus.COMPLETED)
                                }
                            },
                            enabled = processingCount > 0,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                        ) {
                            Text("Mark $processingCount Paid", fontSize = 11.sp, color = Color.Black, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Text(
                text = "Withdrawal Queue (${withdrawals.size} Total)",
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = Color.White
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(withdrawals) { wd ->
                    val bankTag = wd.bankTag.ifBlank { findBankByTag(wd.bankName).tag }
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(wd.userName, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.White)
                                Text("Net ₦${wd.netAmount}", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EmeraldPrimary)
                            }

                            Text("Bank: ${wd.bankName} (Tag: $bankTag)", fontSize = 11.sp, color = Color.LightGray)
                            Text("Account Number: ${wd.accountNumber}", fontSize = 11.sp, color = Color.LightGray)
                            Text("Status: ${wd.status.name}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = when(wd.status) {
                                WithdrawalStatus.COMPLETED -> EmeraldPrimary
                                WithdrawalStatus.PROCESSING -> Color(0xFFF59E0B)
                                WithdrawalStatus.REJECTED -> Color(0xFFEF4444)
                                else -> Color(0xFF029FFC)
                            })

                            // Individual Status Switcher Buttons
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Button(
                                    onClick = { onStatusChanged(wd.id, WithdrawalStatus.PROCESSING) },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
                                ) {
                                    Text("Processing", fontSize = 10.sp, color = Color.Black)
                                }
                                Button(
                                    onClick = { onStatusChanged(wd.id, WithdrawalStatus.COMPLETED) },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                                ) {
                                    Text("Complete", fontSize = 10.sp, color = Color.Black)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
