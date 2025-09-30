import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ionhive_water_purifier/core/controllers/connectivity_controller.dart';
import 'package:ionhive_water_purifier/utils/widgets/snackbar/custom_snackbar.dart';

class NoInternetScreen extends StatefulWidget {
  const NoInternetScreen({super.key});

  @override
  State<NoInternetScreen> createState() => _NoInternetScreenState();
}

class _NoInternetScreenState extends State<NoInternetScreen> {
  final connectivityController = Get.find<ConnectivityController>();
  bool isRetrying = false;

  @override
  void initState() {
    super.initState();
    // Navigation and snackbar are handled by ConnectivityController
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;
    final colorScheme = theme.colorScheme;
    final mediaQuery = MediaQuery.of(context);

    double screenWidth = mediaQuery.size.width;
    double screenHeight = mediaQuery.size.height;

    return WillPopScope(
      onWillPop: () async => false, // 🔒 Disable back button
      child: Scaffold(
        backgroundColor: colorScheme.background,
        body: Center(
          child: SingleChildScrollView(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.08),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: colorScheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black12,
                          blurRadius: 12,
                          offset: Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.wifi_off_rounded,
                          size: screenWidth * 0.25,
                          color: colorScheme.error,
                        ),
                        SizedBox(height: screenHeight * 0.03),
                        Text(
                          "You're Offline",
                          style: textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: colorScheme.onBackground,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: screenHeight * 0.015),
                        Text(
                          "Please check your internet connection and tap retry.",
                          style: textTheme.bodyLarge?.copyWith(
                            color: colorScheme.onBackground.withOpacity(0.7),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: screenHeight * 0.04),
                        ElevatedButton.icon(
                          onPressed: isRetrying
                              ? null
                              : () async {
                                  setState(() => isRetrying = true);
                                  await connectivityController
                                      .checkConnection();
                                  await Future.delayed(
                                      const Duration(milliseconds: 800));
                                  if (!connectivityController
                                      .isConnected.value) {
                                    _showNoInternetSnackbar();
                                  }
                                  if (mounted) {
                                    setState(() => isRetrying = false);
                                  }
                                },
                          icon: isRetrying
                              ? SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: colorScheme.onPrimary,
                                  ),
                                )
                              : const Icon(
                                  Icons.wifi_off,
                                  color: Colors.white,
                                ),
                          label: Text(
                            isRetrying ? "Checking..." : "Retry",
                            style: textTheme.bodyLarge?.copyWith(
                              color: colorScheme.onPrimary,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: colorScheme.primary,
                            padding: EdgeInsets.symmetric(
                              vertical: screenHeight * 0.018,
                              horizontal: screenWidth * 0.12,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showNoInternetSnackbar() {
    CustomSnackbar.showError(
      message: "Still no internet. Please check your connection!",
    );
  }
}
