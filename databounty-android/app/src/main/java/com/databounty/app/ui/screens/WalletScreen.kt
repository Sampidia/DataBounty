package com.databounty.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import com.databounty.app.model.BankInfo
import com.databounty.app.model.DEFAULT_BANK
import com.databounty.app.model.POPULAR_BANKS
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
    var showInsufficientBalanceDialog by remember { mutableStateOf(false) }
    var attemptedAmount by remember { mutableStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Tester Wallet & Cashout",
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
                        text = "Available Wallet Balance",
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
                        Text("Min Threshold: ₦150 (₦100 net + ₦50 fee)", fontSize = 11.sp, color = Color.LightGray)
                        Text("Instant Payout PENDING Queue", fontSize = 11.sp, color = TealAccent)
                    }

                    Button(
                        onClick = {
                        if (user.walletBalance < 150) {
                                attemptedAmount = 150
                                showInsufficientBalanceDialog = true
                            } else {
                                showWithdrawDialog = true
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                    ) {
                        Text(
                            text = "Cash Out to Bank",
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
                        text = "• Cashout ₦150 – ₦9,999: ₦50 Fee Tier\n• Cashout ₦10,000+: ₦100 Fee Tier",
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
                onConfirm = { amount, bank ->
                    if (amount > user.walletBalance) {
                        attemptedAmount = amount
                        showWithdrawDialog = false
                        showInsufficientBalanceDialog = true
                    } else {
                        val fee = calculateWithdrawalFee(amount)
                        val newWd = WithdrawalRequest(
                            id = "wd_${System.currentTimeMillis()}",
                            userId = user.id,
                            userName = user.name,
                            amount = amount,
                            fee = fee,
                            netAmount = amount - fee,
                            bankName = bank.name,
                            bankCode = bank.code,
                            bankTag = bank.tag,
                            accountNumber = user.accountNumber,
                            accountName = user.accountName,
                            requestedAt = "Just now"
                        )
                        onWithdrawRequested(newWd)
                        showWithdrawDialog = false
                    }
                }
            )
        }

        if (showInsufficientBalanceDialog) {
            AlertDialog(
                onDismissRequest = { showInsufficientBalanceDialog = false },
                containerColor = Color(0xFF111827),
                title = {
                    Text(
                        text = "Insufficient Wallet Balance",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = Color(0xFFEF4444)
                    )
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "You do not have enough in your balance to cash out ₦$attemptedAmount.",
                            fontSize = 13.sp,
                            color = Color.White
                        )
                        Text(
                            text = "Current Available Balance: ₦${user.walletBalance.toInt()}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldPrimary
                        )
                        Text(
                            text = "Please reduce your withdrawal amount or complete more tasks to earn more money.",
                            fontSize = 12.sp,
                            color = Color.LightGray
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = { showInsufficientBalanceDialog = false },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                    ) {
                        Text("Got it", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            )
        }
    }
}

@Composable
fun WithdrawalDialog(
    user: UserProfile,
    onDismiss: () -> Unit,
    onConfirm: (Int, BankInfo) -> Unit
) {
    var amountText by remember { mutableStateOf("2000") }
    var selectedBank by remember { mutableStateOf(DEFAULT_BANK) }
    var bankSearchText by remember { mutableStateOf("") }
    var accountNumber by remember { mutableStateOf(user.accountNumber) }
    var accountName by remember { mutableStateOf(user.accountName) }
    var isVerified by remember { mutableStateOf(user.accountNumber.length == 10) }
    var isInvalidDetails by remember { mutableStateOf(false) }
    var isBankListExpanded by remember { mutableStateOf(false) }

    val amount = amountText.toIntOrNull() ?: 0
    val fee = calculateWithdrawalFee(amount)
    val netAmount = (amount - fee).coerceAtLeast(0)

    val filteredBanks = POPULAR_BANKS.filter {
        it.name.contains(bankSearchText, ignoreCase = true) ||
        it.code.contains(bankSearchText, ignoreCase = true) ||
        it.tag.contains(bankSearchText, ignoreCase = true)
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF111827),
        title = {
            Text("Naira Bank Cashout", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                
                // Amount Field
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("Cashout Amount (₦ NGN)", color = Color.Gray) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // Searchable Bank Dropdown Selector
                Text("Select Bank (Searchable)", fontSize = 11.sp, color = Color.LightGray)
                Surface(
                    color = Color(0xFF1F2937),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth().clickable { isBankListExpanded = !isBankListExpanded }
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("${selectedBank.name} (${selectedBank.code})", color = EmeraldPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text(if (isBankListExpanded) "▲" else "▼", color = Color.Gray, fontSize = 10.sp)
                    }
                }

                if (isBankListExpanded) {
                    OutlinedTextField(
                        value = bankSearchText,
                        onValueChange = { bankSearchText = it },
                        placeholder = { Text("Filter banks...", fontSize = 11.sp) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Surface(
                        color = Color(0xFF0B0F17),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().height(140.dp)
                    ) {
                        LazyColumn(modifier = Modifier.padding(6.dp)) {
                            items(filteredBanks) { bank ->
                                Text(
                                    text = "${bank.name} (${bank.code})",
                                    color = if (selectedBank.code == bank.code) EmeraldPrimary else Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = if (selectedBank.code == bank.code) FontWeight.Bold else FontWeight.Normal,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            selectedBank = bank
                                            isBankListExpanded = false
                                            isVerified = false
                                            isInvalidDetails = false
                                        }
                                        .padding(vertical = 6.dp, horizontal = 8.dp)
                                )
                            }
                        }
                    }
                }

                // Account Number & Verify Button Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = accountNumber,
                        onValueChange = {
                            accountNumber = it
                            isVerified = false
                            isInvalidDetails = false
                        },
                        label = { Text("NUBAN Account (10 digits)", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )

                    Button(
                        onClick = {
                            if (accountNumber.length == 10 && accountNumber != "0000000000") {
                                isVerified = true
                                isInvalidDetails = false
                                accountName = user.name.uppercase()
                            } else {
                                isVerified = false
                                isInvalidDetails = true
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF025BE5))
                    ) {
                        Text("Verify", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }

                // Light Red Box for Invalid Withdrawal Details
                if (isInvalidDetails) {
                    Surface(
                        color = Color(0x33EF4444),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "invalid withdrawal details",
                            color = Color(0xFFFCA5A5),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                // Breakdown Surface
                Surface(
                    color = Color(0xFF0B0F17),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Gross Cashout: ₦$amount", fontSize = 11.sp, color = Color.White)
                        Text("Withdrawal Fee: -₦$fee", fontSize = 11.sp, color = Color(0xFFF59E0B))
                        Text("Net Bank Transfer: ₦$netAmount", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { if (amount >= 150 && !isInvalidDetails) onConfirm(amount, selectedBank) },
                enabled = amount >= 150 && !isInvalidDetails,
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
