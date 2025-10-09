import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/repositories/home_repository.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ionhive_technician_app/core/controllers/session_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/auth/domain/repositories/auth_repository.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/landing_page.dart';
import 'package:ionhive_technician_app/utils/exception/exception.dart';
import 'package:ionhive_technician_app/utils/widgets/snackbar/custom_snackbar.dart';

class TechnicianAuthController extends GetxController {
  final TechnicianAuthRepository _authRepository = TechnicianAuthRepository();

  // Controllers
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  // Validation Errors
  Rx<String?> emailValidationError = Rx<String?>(null);
  Rx<String?> passwordValidationError = Rx<String?>(null);

  final RxBool isLoading = false.obs;
  final RxBool isChecked = false.obs;

  // Email validation
  String? validateEmail() {
    final email = emailController.text.trim();
    final emailRegex = RegExp(r"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$");

    if (email.isEmpty) {
      return 'Please enter an email address.';
    } else if (!emailRegex.hasMatch(email)) {
      return 'Please enter a valid email address.';
    }
    return null;
  }

  // Password validation
  String? validatePassword() {
    final password = passwordController.text;

    if (password.isEmpty) {
      return 'Please enter a password.';
    } else if (password.length < 4) {
      return 'Password must be at least 4 digits.';
    }
    return null;
  }

  // On email change
  void onEmailChanged(String value) {
    emailValidationError.value = validateEmail();
  }

  // On password change
  void onPasswordChanged(String value) {
    passwordValidationError.value = validatePassword();
  }

  // Handle login using email and password
  Future<void> handleLogin() async {
    emailValidationError.value = validateEmail();
    passwordValidationError.value = validatePassword();

    if (emailValidationError.value != null ||
        passwordValidationError.value != null) {
      return;
    }
    if (!isChecked.value) {
      CustomSnackbar.showError(
        message: "Please accept the terms and conditions.",
      );
      return;
    }
    isLoading.value = true;
    try {
      final response = await _authRepository.loginWithEmailAndPassword(
        email: emailController.text.trim(),
        password: passwordController.text.trim(),
      );

      if (!response.error) {
        final token = response.token;
        final userId = response.data?['user_id'];
        final emailId = response.data?['email'];
        final username = response.data?['username'];
        final role_id = response.data?['role_id'];
        final technician_id = response.data?['technician_id'];

        final sessionController = Get.find<SessionController>();
        await sessionController.saveSession(
          userId: userId,
          emailId: emailId,
          username: username,
          token: token!,
          userRole: role_id,
          technicianId: technician_id,
        );

        // Initialize TaskRepository and TechnicianController after successful login
        Get.put(TaskRepository());
        Get.put(TechnicianController(Get.find<TaskRepository>()));
        final controller = Get.find<TechnicianController>();
        await controller.loadTasks(); // Call loadTasks after initialization

        Get.offAll(
          () => TechnicianLandingPage(),
          transition: Transition.rightToLeft,
          duration: const Duration(milliseconds: 300),
        );
        emailController.clear();
        passwordController.clear();
      } else {
        CustomSnackbar.showError(message: response.message);
      }
    } on HttpException catch (e) {
      CustomSnackbar.showError(message: e.message);
      debugPrint("Login http error: ${e.message}");
    } catch (e) {
      CustomSnackbar.showError(message: "An error occurred. Please try again.");
      debugPrint("Login error: $e");
    } finally {
      isLoading.value = false;
    }
  }

  @override
  void onInit() {
    super.onInit();
    emailController.clear();
    passwordController.clear();
    emailValidationError.value = null;
    passwordValidationError.value = null;
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
    Get.closeAllSnackbars();
  }
}
