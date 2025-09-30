import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart'; // Session Controller
import 'package:ionhive_water_purifier/feature/end_user_app/auth/domain/repositories/auth_repository.dart'; // Auth Repository
import 'package:ionhive_water_purifier/feature/end_user_app/auth/presentation/pages/otp_page.dart'; // OTP Page
import 'package:ionhive_water_purifier/feature/end_user_app/landing_page.dart'; // Laning pages
import 'package:ionhive_water_purifier/utils/widgets/snackbar/custom_snackbar.dart'; // Custom Snackbar

class AppUserAuthController extends GetxController {
  final AppUserAuthRepository _authRepository = AppUserAuthRepository();
  final TextEditingController emailController = TextEditingController();
  final otpController = TextEditingController();
  final otpValidationError =
      RxnString(); // Nullable String to hold validation error

  Rx<String?> validationError = Rx<String?>(null);

  final RxBool isLoading = false.obs;
  final RxBool isChecked = false.obs;

  String? validateEmail() {
    final email = emailController.text;
    final emailRegex = RegExp(r"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$");

    if (email.isEmpty) {
      return 'Please enter an email address.';
    } else if (!emailRegex.hasMatch(email)) {
      return 'Please enter a valid email address.';
    }

    return null;
  }

  String? validateOtp() {
    final otp = otpController.text.trim();

    if (otp.isEmpty) {
      return "OTP cannot be empty";
    }
    if (otp.length != 6) {
      return "OTP must be 6 digits";
    }
    return null;
  }

  // Logic for "Get OTP" button  // - Completed
  Future<void> handleGetOTP() async {
    final email = emailController.text;

    // Validate input
    final emailValidationError = validateEmail();
    if (emailValidationError != null) {
      validationError.value =
          emailValidationError; // Show email validation error immediately
      return;
    }
    if (!isChecked.value) {
      CustomSnackbar.showError(
        message: "Please accept the terms and conditions.",
      );
      return;
    }

    // Clear any previous validation errors before starting the OTP request
    validationError.value = null;

    isLoading.value = true;
    try {
      final otpResponse = await _authRepository.GetOTP(email);

      if (!otpResponse.error) {
        // Clear OTP field before navigating to OTP page
        otpController.clear();
        otpValidationError.value = null;

        // Navigate to OTP page
        Get.to(() => OtpPage(email: email));
      } else {
        debugPrint("Error: ${otpResponse.message}}");

        validationError.value = otpResponse.message; // Show error message
      }
    } catch (e) {
      // validationError.value = "Something went wrong! Please Try Again later";
      validationError.value = e.toString(); // Show actual error message

      debugPrint("Error: $e");
    } finally {
      isLoading.value = false;
    }
  }

  // Logic for "Resend OTP" button  // - Completed
  Future<void> resendOtp() async {
    final email = emailController.text;

    // Validate input
    validationError.value = validateEmail();
    if (validationError.value != null) {
      return;
    }

    isLoading.value = true;
    try {
      final otpResponse = await _authRepository.GetOTP(email);

      if (!otpResponse.error) {
        // Clear OTP field before navigating to OTP page
        otpController.clear();
        otpValidationError.value = null;
        emailController.clear();
        // Show success message
        CustomSnackbar.showSuccess(message: "OTP sent successfully");
      } else {
        validationError.value = otpResponse.message; // Show error message
      }
    } catch (e) {
      validationError.value = e.toString(); // Show actual error message
      debugPrint("Error: $e");
    } finally {
      isLoading.value = false;
    }
  }

  // Authenticate OTP Function  // - Completed
  Future<void> authenticateOTPandHandleLogin() async {
    final email = emailController.text;
    final otpText = otpController.text;

    // Validate email
    validationError.value = validateEmail();
    if (validationError.value != null) return;

    // Validate OTP as a String
    String? otp = otpText.trim(); // Remove leading/trailing whitespace
    if (otp.isEmpty) {
      otpValidationError.value = 'OTP cannot be empty.';
      return;
    }
    // Optional: Validate that OTP contains only digits (if required by backend)
    if (!RegExp(r'^\d+$').hasMatch(otp)) {
      otpValidationError.value =
          'Invalid OTP format. Please enter numbers only.';
      return;
    }

    isLoading.value = true;
    try {
      // Pass OTP as a String to the repository
      final authenticateResponse =
          await _authRepository.authenticateOTP(email, otp);

      if (!authenticateResponse.error) {
        // Success flow
        final token = authenticateResponse.token;
        final userId = authenticateResponse.data?['user_id'];
        final emailId = authenticateResponse.data?['email'];
        final username = authenticateResponse.data?['username'];
        final role_id = authenticateResponse.data?['role_id'];
        final is_subscribed = authenticateResponse.data?['is_subscribed'];

        final sessionController = Get.find<SessionController>();
        await sessionController.saveSession(
          userId: userId,
          emailId: emailId,
          username: username,
          token: token!,
          userRole: role_id,
          isSubscribed: is_subscribed,
        );

        otpController.clear();

        Get.offAll(
          () => AppUserLandingPage(),
          transition: Transition.rightToLeft,
          duration: const Duration(milliseconds: 300),
        );
      } else {
        // Show the exact backend message (like "Invalid OTP" or server error)
        CustomSnackbar.showError(message: authenticateResponse.message);
        // otpValidationError.value = authenticateResponse.message ?? "Unknown error";
      }
    } catch (e) {
      // Unexpected errors, network issues, etc.
      CustomSnackbar.showError(
          message: "An error occurred. Please try again later.");
      // otpValidationError.value = "An error occurred. Please try again later.";
      debugPrint("Unexpected error: $e");
    } finally {
      isLoading.value = false;
    }
  }

  // This is the onInit lifecycle method of the GetxController
  @override
  void onInit() {
    super.onInit();
    // Reset validation error
    validationError.value = null;
    emailController.clear();
  }

  // This is the dispose lifecycle method of the GetxController
  @override
  void dispose() {
    emailController.dispose();
    super.dispose();
    Get.closeAllSnackbars(); // Close all active snackbars
  }
}
