import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Light Theme
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    fontFamily: GoogleFonts.poppins().fontFamily,
    primaryColor: Colors.blue[600]!,
    primaryColorDark: Colors.blue[800]!,
    primarySwatch: Colors.blue,
    brightness: Brightness.light,
    scaffoldBackgroundColor: Colors.white,

    appBarTheme: AppBarTheme(
      color: Colors.transparent,
      iconTheme: const IconThemeData(color: Colors.white),
      titleTextStyle: TextStyle(
        fontFamily: 'Poppins',
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
      elevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    textTheme: TextTheme(
      displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w600, color: Colors.white),
      displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w600, color: Colors.white),
      displaySmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: Colors.white),
      headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Colors.white),
      headlineSmall: TextStyle(fontSize: 18, color: Colors.blueGrey[600]),
      titleLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Colors.blueGrey[600]),
      bodyLarge: TextStyle(fontSize: 14, color: Colors.blue[900]),
      bodyMedium: TextStyle(fontSize: 12, color: Colors.blueGrey[600]),
    ),
    colorScheme: ColorScheme.light(
      primary: Colors.blue[600]!,
      secondary: Colors.blue[400]!,
      surface: Colors.white.withOpacity(0.2),
      background: Colors.blue[50]!,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: Colors.blue[900]!,
      onBackground: Colors.blueGrey[600]!,
    ),
    extensions: <ThemeExtension<dynamic>>[
      ShimmerColors(
        baseColor: Colors.blue[300]!.withOpacity(0.5),
        highlightColor: Colors.blue[400]!.withOpacity(0.7),
      ),
    ],
    cardTheme: CardThemeData(
      color: Colors.white.withOpacity(0.2),
      elevation: 0,
      margin: EdgeInsets.zero,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.white.withOpacity(0.3)),
      ),
    ),
    dividerColor: Colors.blue[200]!.withOpacity(0.3),
    iconTheme: IconThemeData(color: Colors.blue[600]!),
    tabBarTheme: TabBarThemeData(
      labelColor: Colors.blue[600]!,
      unselectedLabelColor: Colors.blueGrey[400]!,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        textStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 16, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        elevation: 5,
        shadowColor: Colors.blue[400]!.withOpacity(0.4),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.blue[600]!,
        side: BorderSide(color: Colors.blue[200]!, width: 1),
        textStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 16, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: Colors.blue[600]!,
        textStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 14, fontWeight: FontWeight.w500),
      ),
    ),
  );

  // Dark Theme
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    fontFamily: GoogleFonts.poppins().fontFamily,
    primaryColor: Colors.blue[600]!,
    primaryColorDark: Colors.blue[900]!,
    primarySwatch: Colors.blue,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: Colors.blue[900]!,

    appBarTheme: AppBarTheme(
      color: Colors.transparent,
      iconTheme: const IconThemeData(color: Colors.white),
      titleTextStyle: TextStyle(fontFamily: 'Poppins', fontSize: 20, fontWeight: FontWeight.w600, color: Colors.white),
      elevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    textTheme: TextTheme(
      displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w600, color: Colors.white),
      displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w600, color: Colors.white),
      displaySmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: Colors.white),
      headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Colors.white),
      headlineSmall: TextStyle(fontSize: 18, color: Colors.blueGrey[300]),
      titleLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Colors.blueGrey[300]),
      bodyLarge: TextStyle(fontSize: 14, color: Colors.blue[200]!),
      bodyMedium: TextStyle(fontSize: 12, color: Colors.blueGrey[300]),
    ),
    colorScheme: ColorScheme.dark(
      primary: Colors.blue[600]!,
      secondary: Colors.blue[400]!,
      surface: Colors.blue[800]!.withOpacity(0.2),
      background: Colors.blue[900]!,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: Colors.blue[200]!,
      onBackground: Colors.blueGrey[300]!,
    ),
    extensions: <ThemeExtension<dynamic>>[
      ShimmerColors(
        baseColor: Colors.blue[800]!.withOpacity(0.5),
        highlightColor: Colors.blue[600]!.withOpacity(0.7),
      ),
    ],
    cardTheme: CardThemeData(
      color: Colors.blue[800]!.withOpacity(0.2),
      elevation: 0,
      margin: EdgeInsets.zero,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.white.withOpacity(0.3)),
      ),
    ),
    dividerColor: Colors.blue[600]!.withOpacity(0.3),
    iconTheme: IconThemeData(color: Colors.blue[400]!),
    tabBarTheme: TabBarThemeData(
      labelColor: Colors.blue[400]!,
      unselectedLabelColor: Colors.blueGrey[400]!,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        textStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 16, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        elevation: 5,
        shadowColor: Colors.blue[400]!.withOpacity(0.4),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.blue[400]!,
        side: BorderSide(color: Colors.blue[600]!, width: 1),
        textStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 16, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: Colors.blue[400]!,
        textStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 14, fontWeight: FontWeight.w500),
      ),
    ),
  );
}

// Custom shimmer colors extension
class ShimmerColors extends ThemeExtension<ShimmerColors> {
  final Color baseColor;
  final Color highlightColor;

  const ShimmerColors({required this.baseColor, required this.highlightColor});

  @override
  ThemeExtension<ShimmerColors> copyWith({Color? baseColor, Color? highlightColor}) {
    return ShimmerColors(
      baseColor: baseColor ?? this.baseColor,
      highlightColor: highlightColor ?? this.highlightColor,
    );
  }

  @override
  ThemeExtension<ShimmerColors> lerp(ThemeExtension<ShimmerColors>? other, double t) {
    if (other is! ShimmerColors) return this;
    return ShimmerColors(
      baseColor: Color.lerp(baseColor, other.baseColor, t)!,
      highlightColor: Color.lerp(highlightColor, other.highlightColor, t)!,
    );
  }
}
