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
    OPTION1_WEBHOOK, // Auto-verified via Apps Script Webhook
    OPTION2_MANUAL    // Testers submit verification code and screenshot. Creator manually approves each submission.
}

data class BankInfo(
    val name: String,
    val code: String,
    val tag: String,
    val country: String = "Nigeria",
    val currency: String = "NGN"
)

val DEFAULT_BANK = BankInfo("Opay", "100004", "opay")

val POPULAR_BANKS = listOf(
    DEFAULT_BANK,
    BankInfo("Palmpay", "100033", "palmpay"),
    BankInfo("Moniepoint Microfinance Bank", "090405", "moniepoint"),
    BankInfo("Kuda", "090267", "kuda"),
    BankInfo("GTBANK PLC", "058", "gtb"),
    BankInfo("ZENITH BANK PLC", "057", "zenith"),
    BankInfo("ACCESS BANK NIGERIA", "044", "access"),
    BankInfo("UNITED BANK FOR AFRICA PLC", "033", "uba"),
    BankInfo("FIRST BANK PLC", "011", "firstbank"),
    BankInfo("FIRST CITY MONUMENT BANK PLC", "214", "fcmb"),
    BankInfo("STANBIC IBTC BANK PLC", "221", "stanbic"),
    BankInfo("STERLING BANK PLC", "232", "sterling"),
    BankInfo("WEMA BANK PLC", "035", "wema"),
    BankInfo("FIDELITY BANK PLC", "070", "fidelity"),
    BankInfo("UNION BANK OF NIGERIA PLC", "032", "unionbank"),
    BankInfo("KEYSTONE BANK PLC", "082", "keystone"),
    BankInfo("Polaris bank", "076", "polaris"),
    BankInfo("ProvidusBank PLC", "101", "providusbank"),
    BankInfo("Rubies Microfinance Bank", "090175", "rubiesbank"),
    BankInfo("VFD Micro Finance Bank", "090110", "vfd"),
    BankInfo("Carbon", "100026", "carbon"),
    BankInfo("Fairmoney Microfinance Bank Ltd", "090551", "fairmoney"),
    BankInfo("Paga", "327", "paga"),
    BankInfo("JAIZ BANK", "301", "jaiz"),
    BankInfo("TAJ BANK PLC", "000026", "taj"),
    BankInfo("PAYCOM", "305", "paycom")
)

fun findBankByTag(tagOrName: String): BankInfo {
    val q = tagOrName.trim().lowercase()
    return POPULAR_BANKS.find { it.tag.lowercase() == q || it.name.lowercase() == q || it.code == q } ?: DEFAULT_BANK
}

data class BountyTask(
    val id: String,
    val creatorId: String? = null,
    val creatorName: String,
    val title: String,
    val description: String,
    val category: TaskCategory,
    val rewardPerUser: Int,
    val totalSpots: Int,
    val completedSpots: Int,
    val reservedSpots: Int = 0,
    val targetCountry: String = "Nigeria",
    val targetState: String = "All",
    val targetGender: String = "All",
    val verificationType: VerificationType = VerificationType.OPTION1_WEBHOOK,
    val googleFormVerificationType: String? = null,
    val webhookSecret: String? = null,
    val formLink: String? = null,
    val appDownloadUrl: String? = null,
    val websiteUrl: String? = null,
    val testInstructions: String = "",
    val creatorFeePaid: Int? = null,
    val totalBudget: Int? = null,
    val createdAt: String? = null
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
    val bankTag: String = "opay",
    val bankCode: String = "100004",
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

data class TaskSubmission(
    val id: String,
    val taskId: String,
    val taskTitle: String,
    val userId: String,
    val userName: String,
    val userEmail: String = "",
    val userState: String,
    val userGender: String,
    val rewardAmount: Int,
    val status: String = "pending", // "pending", "approved", "rejected"
    val secretCode: String? = null,
    val proofUrl: String? = null,
    val rejectionReason: String? = null,
    val submittedAt: String = ""
)
