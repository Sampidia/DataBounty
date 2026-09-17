package com.databounty.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val DarkBackground = Color(0xFF0B0F17)
val DarkSurface = Color(0xFF111827)
val DarkSurfaceVariant = Color(0xFF1F2937)

val EmeraldPrimary = Color(0xFF10B981)
val EmeraldLight = Color(0xFF34D399)
val TealAccent = Color(0xFF14B8A6)
val AmberAccent = Color(0xFFF59E0B)

private val DarkColorScheme = darkColorScheme(
    primary = EmeraldPrimary,
    onPrimary = Color(0xFF042F2E),
    primaryContainer = Color(0xFF065F46),
    onPrimaryContainer = Color(0xFFA7F3D0),
    secondary = TealAccent,
    background = DarkBackground,
    surface = DarkSurface,
    surfaceVariant = DarkSurfaceVariant,
    onBackground = Color(0xFFF3F4F6),
    onSurface = Color(0xFFF3F4F6)
)

@Composable
fun DataBountyTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
