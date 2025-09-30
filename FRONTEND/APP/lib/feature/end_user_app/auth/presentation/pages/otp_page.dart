import 'package:ionhive_water_purifier/feature/end_user_app/landing_page.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:ionhive_water_purifier/feature/end_user_app/auth/presentation/controllers/auth_controller.dart'; //Auth Controller
import 'package:ionhive_water_purifier/utils/widgets/button/custom_button.dart'; // Custom Button
import 'package:ionhive_water_purifier/utils/widgets/input_field/otp_inputfield.dart'; // OTP Input Field

class OtpPage extends StatelessWidget {
  final String email;
  final AppUserAuthController controller = Get.find();

  OtpPage({super.key, required this.email});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return WillPopScope(
      onWillPop: () async {
        controller.otpController.clear();
        controller.otpValidationError.value = null;
        return true;
      },
      child: Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: theme.colorScheme.onSurface),
            onPressed: () {
              controller.otpController.clear();
              controller.otpValidationError.value = null;
              Get.back();
            },
          ),
        ),
        body: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 32),
                      Text(
                        "Verify OTP",
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.primaryColor,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        "We’ve sent a verification code to",
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.grey.shade700,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        email,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      OtpInputPage(
                        controller: controller.otpController,
                        errorText: controller.otpValidationError,
                      ),
                      const SizedBox(height: 32),
                      Obx(() {
                        return CustomButton(
                          text: "Verify & Continue",
                          onPressed: () {
                            FocusScope.of(context).unfocus();
                            final otp = controller.otpController.text.trim();
                            if (otp.isNotEmpty) {
                              controller.isLoading.value = false;
                              controller.authenticateOTPandHandleLogin();
                            } else {
                              controller.otpValidationError.value =
                                  "Please enter a valid OTP";
                            }
                          },
                          isLoading: controller.isLoading.value,
                          borderRadius: 16.0,
                          textStyle: theme.textTheme.bodyLarge!,
                          boxShadow: BoxShadow(
                            color: theme.primaryColor.withOpacity(0.5),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        );
                      }),
                      const SizedBox(height: 24),
                      // Continue as guest button
                      _buildGuestButton(theme),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 20.0),
                child: Text(
                  "Powered by\nIonHive Innovations",
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Widget _buildGuestButton(ThemeData theme) {
  return AnimatedOpacity(
    opacity: 1.0,
    duration: const Duration(milliseconds: 1400),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(width: 8),
        Flexible(
          child: RichText(
            text: TextSpan(
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onBackground,
              ),
              children: [
                const TextSpan(
                  text:
                      "Don't have an OTP or want to continue without verification? Try our ",
                ),
                WidgetSpan(
                  child: GestureDetector(
                    onTap: () {
                      Get.to(
                        AppUserLandingPage(),
                        transition: Transition.rightToLeft,
                        duration: const Duration(milliseconds: 300),
                      );
                    },
                    child: Text(
                      "Guest Mode",
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.primaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const TextSpan(text: " to explore the app without signing in."),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}
