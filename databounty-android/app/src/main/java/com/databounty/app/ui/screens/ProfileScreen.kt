package com.databounty.app.ui.screens

import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.databounty.app.model.NIGERIAN_STATES
import com.databounty.app.model.UserProfile
import com.databounty.app.ui.theme.EmeraldPrimary
import com.databounty.app.ui.theme.TealAccent

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    user: UserProfile,
    onSaveProfile: (UserProfile) -> Unit
) {
    var name by remember { mutableStateOf(user.name) }
    var phone by remember { mutableStateOf(user.phone) }
    var gender by remember { mutableStateOf(user.gender) }
    var state by remember { mutableStateOf(user.state) }
    var isStateMenuExpanded by remember { mutableStateOf(false) }

    // Captured device information from android.os.Build
    val deviceBrand = Build.MANUFACTURER.capitalize()
    val deviceModel = Build.MODEL
    val osVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Native Profile & Device Specs",
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
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            
            // Personal Information Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Demographic Details",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = EmeraldPrimary
                    )

                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Full Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone Number (+234)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    // Gender Selector
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = gender == "Male",
                            onClick = { gender = "Male" },
                            label = { Text("Male") },
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            selected = gender == "Female",
                            onClick = { gender = "Female" },
                            label = { Text("Female") },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // 36 States + FCT Dropdown Menu
                    ExposedDropdownMenuBox(
                        expanded = isStateMenuExpanded,
                        onExpandedChange = { isStateMenuExpanded = !isStateMenuExpanded },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = state,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("State of Residency (Targeting)") },
                            trailingIcon = {
                                Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor()
                        )

                        ExposedDropdownMenu(
                            expanded = isStateMenuExpanded,
                            onDismissRequest = { isStateMenuExpanded = false }
                        ) {
                            NIGERIAN_STATES.forEach { stateItem ->
                                DropdownMenuItem(
                                    text = { Text(stateItem) },
                                    onClick = {
                                        state = stateItem
                                        isStateMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            }

            // Captured Device Information Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Auto-Captured Device Specs",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = TealAccent
                    )

                    Text(
                        text = "Brand & Model: $deviceBrand $deviceModel",
                        fontSize = 12.sp,
                        color = Color.White
                    )
                    Text(
                        text = "OS Version: $osVersion",
                        fontSize = 12.sp,
                        color = Color.LightGray
                    )
                }
            }

            // Save Profile Button
            Button(
                onClick = {
                    onSaveProfile(
                        user.copy(
                            name = name,
                            phone = phone,
                            gender = gender,
                            state = state,
                            deviceBrand = deviceBrand,
                            deviceModel = deviceModel,
                            osVersion = osVersion
                        )
                    )
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
            ) {
                Text("Save Profile Changes", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }
    }
}
