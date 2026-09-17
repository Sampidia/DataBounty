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
import com.databounty.app.ui.theme.EmeraldPrimary
import com.databounty.app.ui.theme.TealAccent

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    withdrawals: List<WithdrawalRequest>,
    onStatusChanged: (String, WithdrawalStatus) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Admin Payout & Status Suite",
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
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            
            Text(
                text = "Withdrawal Requests Queue",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Color.White
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(withdrawals) { wd ->
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

                            Text("Bank: ${wd.bankName} (${wd.accountNumber})", fontSize = 11.sp, color = Color.LightGray)
                            Text("Current Status: ${wd.status.name}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TealAccent)

                            // Status Switcher Buttons
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
