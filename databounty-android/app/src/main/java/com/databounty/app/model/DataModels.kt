package com.databounty.app.model

val NIGERIAN_STATES = listOf(
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo",
    "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
    "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT Abuja"
)

enum class TaskCategory {
    GOOGLE_FORM,
    APP_TEST,
    WEB_BUG
}

enum class VerificationType {
    OPTION1_WEBHOOK,
    OPTION2_MANUAL
}

data class BountyTask(
    val id: String,
    val creatorName: String,
    val title: String,
    val description: String,
    val category: TaskCategory,
    val rewardPerUser: Int,
    val totalSpots: Int,
    val completedSpots: Int,
    val targetCountry: String = "Nigeria",
    val targetState: String = "All",
    val targetGender: String = "All",
    val verificationType: VerificationType = VerificationType.OPTION1_WEBHOOK,
    val formLink: String? = null,
    val appDownloadUrl: String? = null,
    val websiteUrl: String? = null,
    val testInstructions: String = ""
)

data class UserProfile(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val gender: String, // "Male" or "Female"
    val country: String = "Nigeria",
    val state: String, // NigerianState
    val deviceBrand: String,
    val deviceModel: String,
    val osVersion: String,
    val bankName: String,
    val accountNumber: String,
    val accountName: String,
    val walletBalance: Double
)

enum class WithdrawalStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    REJECTED
}

data class WithdrawalRequest(
    val id: String,
    val userId: String,
    val userName: String,
    val amount: Int,
    val fee: Int,
    val netAmount: Int,
    val bankName: String,
    val accountNumber: String,
    val accountName: String,
    val status: WithdrawalStatus = WithdrawalStatus.PENDING,
    val requestedAt: String
)

fun calculateWithdrawalFee(amount: Int): Int {
    return if (amount < 10000) 50 else 100
}

fun calculateCreatorFee(totalBudget: Int): Int {
    return when {
        totalBudget < 10000 -> 50
        totalBudget < 50000 -> 100
        else -> 500
    }
}
