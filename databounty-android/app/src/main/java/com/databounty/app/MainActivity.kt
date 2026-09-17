package com.databounty.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.databounty.app.model.*
import com.databounty.app.ui.screens.AdminScreen
import com.databounty.app.ui.screens.ProfileScreen
import com.databounty.app.ui.screens.TaskFeedScreen
import com.databounty.app.ui.screens.WalletScreen
import com.databounty.app.ui.theme.DataBountyTheme
import com.databounty.app.ui.theme.EmeraldPrimary

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DataBountyTheme {
                MainAppScreen()
            }
        }
    }
}

@Composable
fun MainAppScreen() {
    val navController = rememberNavController()
    var currentScreen by remember { mutableStateOf("feed") }

    // State
    var currentUser by remember {
        mutableStateOf(
            UserProfile(
                id = "usr_tester_101",
                name = "Amina Bello",
                email = "amina.bello@example.com",
                phone = "+2348012345678",
                gender = "Female",
                country = "Nigeria",
                state = "Lagos",
                deviceBrand = "Samsung",
                deviceModel = "Galaxy A54 5G",
                osVersion = "Android 14 (API 34)",
                bankName = "GTBank",
                accountNumber = "0123456789",
                accountName = "AMINA BELLO",
                walletBalance = 4500.0
            )
        )
    }

    var tasks by remember {
        mutableStateOf(
            listOf(
                BountyTask(
                    id = "task_gf_001",
                    creatorName = "TechCraft Studios",
                    title = "Naija E-Commerce Shopping Habits Survey",
                    description = "Provide feedback on online shopping preferences in Nigeria. High reward for detailed answers!",
                    category = TaskCategory.GOOGLE_FORM,
                    rewardPerUser = 500,
                    totalSpots = 50,
                    completedSpots = 32,
                    targetCountry = "Nigeria",
                    targetState = "All",
                    targetGender = "All",
                    testInstructions = "Fill out all questions in the Google Form. Auto-verified via Option 1 Webhook."
                ),
                BountyTask(
                    id = "task_app_002",
                    creatorName = "PayQuick FinTech",
                    title = "Android Beta Testing: PayQuick Money Transfer App",
                    description = "Test native Android money transfer app performance in Lagos & Abuja.",
                    category = TaskCategory.APP_TEST,
                    rewardPerUser = 1200,
                    totalSpots = 20,
                    completedSpots = 14,
                    targetCountry = "Nigeria",
                    targetState = "Lagos",
                    targetGender = "Female",
                    testInstructions = "Download APK, test biometric login, and submit dashboard screenshot."
                )
            )
        )
    }

    var withdrawals by remember {
        mutableStateOf(
            listOf(
                WithdrawalRequest(
                    id = "wd_7002",
                    userId = currentUser.id,
                    userName = currentUser.name,
                    amount = 3000,
                    fee = 50,
                    netAmount = 2950,
                    bankName = currentUser.bankName,
                    accountNumber = currentUser.accountNumber,
                    accountName = currentUser.accountName,
                    status = WithdrawalStatus.PENDING,
                    requestedAt = "Today 17:10"
                )
            )
        )
    }

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF111827),
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.List, contentDescription = "Tasks") },
                    label = { Text("Task Feed") },
                    selected = currentScreen == "feed",
                    onClick = {
                        currentScreen = "feed"
                        navController.navigate("feed")
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = EmeraldPrimary,
                        selectedTextColor = EmeraldPrimary,
                        indicatorColor = Color(0xFF1F2937)
                    )
                )

                NavigationBarItem(
                    icon = { Icon(Icons.Default.AccountBalanceWallet, contentDescription = "Wallet") },
                    label = { Text("Wallet") },
                    selected = currentScreen == "wallet",
                    onClick = {
                        currentScreen = "wallet"
                        navController.navigate("wallet")
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = EmeraldPrimary,
                        selectedTextColor = EmeraldPrimary,
                        indicatorColor = Color(0xFF1F2937)
                    )
                )

                NavigationBarItem(
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile") },
                    selected = currentScreen == "profile",
                    onClick = {
                        currentScreen = "profile"
                        navController.navigate("profile")
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = EmeraldPrimary,
                        selectedTextColor = EmeraldPrimary,
                        indicatorColor = Color(0xFF1F2937)
                    )
                )

                NavigationBarItem(
                    icon = { Icon(Icons.Default.Shield, contentDescription = "Admin") },
                    label = { Text("Admin") },
                    selected = currentScreen == "admin",
                    onClick = {
                        currentScreen = "admin"
                        navController.navigate("admin")
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = EmeraldPrimary,
                        selectedTextColor = EmeraldPrimary,
                        indicatorColor = Color(0xFF1F2937)
                    )
                )
            }
        },
        containerColor = Color(0xFF0B0F17)
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "feed",
            modifier = Modifier.padding(padding)
        ) {
            composable("feed") {
                TaskFeedScreen(
                    user = currentUser,
                    tasks = tasks,
                    onTaskCompleted = { completedTask, reward ->
                        tasks = tasks.map { t ->
                            if (t.id == completedTask.id) t.copy(completedSpots = t.completedSpots + 1) else t
                        }
                        currentUser = currentUser.copy(walletBalance = currentUser.walletBalance + reward)
                    }
                )
            }

            composable("wallet") {
                WalletScreen(
                    user = currentUser,
                    onWithdrawRequested = { newWd ->
                        withdrawals = listOf(newWd) + withdrawals
                        currentUser = currentUser.copy(walletBalance = currentUser.walletBalance - newWd.amount)
                    }
                )
            }

            composable("profile") {
                ProfileScreen(
                    user = currentUser,
                    onSaveProfile = { updated -> currentUser = updated }
                )
            }

            composable("admin") {
                AdminScreen(
                    withdrawals = withdrawals,
                    onStatusChanged = { id, newStatus ->
                        withdrawals = withdrawals.map { w ->
                            if (w.id == id) w.copy(status = newStatus) else w
                        }
                    }
                )
            }
        }
    }
}
