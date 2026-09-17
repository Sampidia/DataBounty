package com.databounty.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Wallet
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.databounty.app.model.UserProfile
import com.databounty.app.model.WithdrawalRequest
import com.databounty.app.model.calculateWithdrawalFee
import com.databounty.app.ui.theme.EmeraldPrimary
import com.databounty.app.ui.theme.TealAccent

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(
    user: UserProfile,
    onWithdrawRequested: (WithdrawalRequest) -> Unit
) {
    var showWithdrawDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Tester Wallet & Payouts",
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
            
            // Wallet Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Available Balance",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )

                    Text(
                        text = "₦${user.walletBalance.toInt()}",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Black,
                        color = EmeraldPrimary
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Min Threshold: ₦100", fontSize = 11.sp, color = Color.LightGray)
                        Text("Paystack NUBAN Verified", fontSize = 11.sp, color = TealAccent)
                    }

                    Button(
                        onClick = { showWithdrawDialog = true },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                    ) {
                        Text(
                            text = "Cash Out to Bank (Min ₦100)",
                            color = Color.Black,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Fee Schedule Banner
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "Transparent Withdrawal Fee Tiers",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = Color.White
                    )
                    Text(
                        text = "• Cashout ₦100 – ₦9,999: ₦50 Withdrawal Fee\n• Cashout ₦10,000+: ₦100 Withdrawal Fee",
                        fontSize = 11.sp,
                        color = Color.LightGray
                    )
                }
            }
        }

        if (showWithdrawDialog) {
            WithdrawalDialog(
                user = user,
                onDismiss = { showWithdrawDialog = false },
                onConfirm = { amount ->
                    val fee = calculateWithdrawalFee(amount)
                    val newWd = WithdrawalRequest(
                        id = "wd_${System.currentTimeMillis()}",
                        userId = user.id,
                        userName = user.name,
                        amount = amount,
                        fee = fee,
                        netAmount = amount - fee,
                        bankName = user.bankName,
                        accountNumber = user.accountNumber,
                        accountName = user.accountName,
                        requestedAt = "Just now"
                    )
                    onWithdrawRequested(newWd)
                    showWithdrawDialog = false
                }
            )
        }
    }
}

@Composable
fun WithdrawalDialog(
    user: UserProfile,
    onDismiss: () -> Unit,
    onConfirm: (Int) -> Unit
) {
    var amountText by remember { mutableStateOf("2000") }
    val amount = amountText.toIntOrNull() ?: 0
    val fee = calculateWithdrawalFee(amount)
    val netAmount = (amount - fee).coerceAtLeast(0)

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF111827),
        title = {
            Text("Request Bank Cashout", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("Withdrawal Amount (₦)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Surface(
                    color = Color(0xFF0B0F17),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Gross Cashout: ₦$amount", fontSize = 11.sp, color = Color.White)
                        Text("Withdrawal Fee: -₦$fee", fontSize = 11.sp, color = Color(0xFFF59E0B))
                        Text("Net Bank Transfer: ₦$netAmount", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { if (amount >= 100 && amount <= user.walletBalance) onConfirm(amount) },
                enabled = amount >= 100 && amount <= user.walletBalance,
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
            ) {
                Text("Confirm Payout", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel", color = Color.Gray) }
        }
    )
}
