// feature/technician_app/settings/presentation/controllers/technician_settings_controller.dart
import 'dart:async';
import 'package:aquapulse_app/core/controllers/session_controller.dart';
import 'package:aquapulse_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:aquapulse_app/feature/service_installation_app/home/domain/repositories/home_repository.dart';
import 'package:aquapulse_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';
import 'package:aquapulse_app/feature/service_installation_app/settings/domain/models/settings_model.dart';
import 'package:aquapulse_app/feature/service_installation_app/settings/domain/repositories/settings_repository.dart';
import 'package:aquapulse_app/utils/widgets/snackbar/custom_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';

class TechnicianSettingsController extends GetxController {
  var technicianData = Rx<TechnicianDetailsModel?>(null);
  var isLoading = true.obs;
  var errorMessage = ''.obs;
  var isRefreshing = false.obs;
  var allTasks = <Task>[].obs;
  var filteredTasks = <Task>[].obs;
  var selectedStatusFilter = 'Pending'.obs;

  final editNameController = TextEditingController();
  final editPhoneController = TextEditingController();
  final editCityController = TextEditingController();
  final formKey = GlobalKey<FormState>();
  var isFormValid = false.obs;
  var isEditLoading = false.obs;

  // Error messages for each field
  var nameError = ''.obs;
  var phoneError = ''.obs;
  var cityError = ''.obs;

  // Notification settings
  var pushNotificationsEnabled = true.obs;
  var isSavingNotifications = false.obs;

  // Contact Us data
  var contactEmail = 'info@outdidunified.com'.obs;
  var contactPhone = '9972071514'.obs;
  var contactWebsite = ''.obs;

  final SettingsRepository _settingsRepository;
  final TechnicianController _technicianController;

  TechnicianSettingsController({
    SettingsRepository? settingsRepository,
    TaskRepository? taskRepository,
  })  : _settingsRepository = settingsRepository ?? SettingsRepository(),
        _technicianController =
            TechnicianController(taskRepository ?? TaskRepository());

  @override
  void onInit() {
    super.onInit();
    fetchTechnicianDetails();
    // fetchContactDetails();
  }

  @override
  void onClose() {
    editNameController.dispose();
    editPhoneController.dispose();
    editCityController.dispose();

    super.onClose();
  }

  void initializeEditForm() {
    if (technicianData.value != null) {
      editNameController.text = technicianData.value?.name ?? '';
      editPhoneController.text = technicianData.value?.phone.toString() ?? '';
      editCityController.text = technicianData.value?.city ?? '';
      // validateForm(); // Validate immediately after initialization
    }
  }

  void validateForm() {
    // Get current values without modifying them
    final name = editNameController.text.trim();
    final phone = editPhoneController.text.trim();
    final city = editCityController.text.trim();

    // Reset error messages
    nameError.value = '';
    phoneError.value = '';
    cityError.value = '';

    // Validate name
    if (name.isEmpty) {
      nameError.value = 'Name is required';
    } else if (name.length < 3) {
      nameError.value = 'Name must be at least 3 characters';
    }

    // Validate phone
    if (phone.isEmpty) {
      phoneError.value = 'Phone number is required';
    } else if (phone.length != 10 || !RegExp(r'^[0-9]+$').hasMatch(phone)) {
      phoneError.value = 'Phone number must be exactly 10 digits';
    }

    // Validate city
    if (city.isEmpty) {
      cityError.value = 'City is required';
    }

    // Update form validity
    isFormValid.value = nameError.value.isEmpty &&
        phoneError.value.isEmpty &&
        cityError.value.isEmpty;
  }

  Future<void> fetchTechnicianDetails() async {
    try {
      isLoading(true);
      final response = await _settingsRepository
          .fetchUserDetails(Get.find<SessionController>().userId.value);
      if (response.error == false && response.data != null) {
        errorMessage.value = '';
        technicianData.value = response.data;
        await Get.find<SessionController>().saveSession(
          userId: response.data!.userId,
          emailId: response.data!.email,
          token: Get.find<SessionController>().token.value,
          userRole: 2, // Technician role
          username: response.data!.name,
          isSubscribed: response.data!.issubscribed,
          technicianId: Get.find<SessionController>().technicianId.value,
        );
        initializeEditForm(); // Reinitialize form after data fetch
      } else {
        errorMessage.value = response.message ?? 'No technician details found';
      }
    } catch (e) {
      errorMessage.value = e.toString();
    } finally {
      isLoading(false);
    }
  }

  Future<void> updateTechnicianDetails({
    required String name,
    required int phone,
    required String city,
  }) async {
    try {
      isEditLoading(true);

      final response = await _settingsRepository.updateUserDetails(
        userId: Get.find<SessionController>().userId.value,
        email: technicianData.value?.email ?? '',
        name: name,
        phone: phone,
        city: city,
      );

      if (response.error == false) {
        technicianData.value = technicianData.value?.copyWith(
          name: name,
          phone: phone,
          city: city,
        );
        CustomSnackbar.showSuccess(message: 'Details updated successfully');
        await Future.delayed(const Duration(seconds: 2));
        Get.back();
      } else {
        CustomSnackbar.showError(
            message: 'Failed to update: ${response.message}');
      }
    } catch (e) {
      CustomSnackbar.showError(message: e.toString());
      rethrow;
    } finally {
      isEditLoading(false);
    }
  }

  Future<void> saveChanges() async {
    if (!isFormValid.value || isEditLoading.value) return;

    isEditLoading(true);

    // Get the current values
    final name = editNameController.text.trim();
    final phoneText = editPhoneController.text.trim();
    final city = editCityController.text.trim();

    // Validate phone number format
    if (phoneText.length != 10 || !RegExp(r'^[0-9]+$').hasMatch(phoneText)) {
      phoneError.value = 'Phone number must be exactly 10 digits';
      isFormValid.value = false;
      isEditLoading(false);
      return;
    }

    // Convert to int for API
    final phoneNumber = int.tryParse(phoneText);
    if (phoneNumber == null) {
      phoneError.value = 'Invalid phone number';
      isFormValid.value = false;
      isEditLoading(false);
      return;
    }

    // Save the changes
    await updateTechnicianDetails(
      name: name,
      phone: phoneNumber,
      city: city,
    );
  }

  void togglePushNotifications(bool value) {
    pushNotificationsEnabled.value = value;
  }

  void loadTasks() {
    isRefreshing.value = true;
    _technicianController.loadTasks().then((_) {
      if (_technicianController.allTasks.isNotEmpty) {
        allTasks.assignAll(_technicianController.allTasks);
        filteredTasks.assignAll(_technicianController.filteredTasks);
        selectedStatusFilter.value =
            _technicianController.selectedStatusFilter.value;
        errorMessage.value = '';
      }
      isRefreshing.value = false;
    }).catchError((e) {
      errorMessage.value = e.toString();
      isRefreshing.value = false;
    });
  }

  int getTaskCount(String status) {
    return allTasks
        .where((task) => task.taskStatus?.toLowerCase() == status.toLowerCase())
        .length;
  }

  Future<void> launchEmail() async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: contactEmail.value,
      query: 'subject=Support%20Request',
    );
    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    } else {
      CustomSnackbar.showError(message: 'Could not launch email client.');
    }
  }

  Future<void> launchPhone() async {
    final Uri phoneUri = Uri.parse('tel:$contactPhone');
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    } else {
      CustomSnackbar.showError(message: 'Could not launch phone dialer.');
    }
  }

  Future<void> launchWebsite() async {
    final Uri websiteUri = Uri.parse(contactWebsite.value);
    if (await canLaunchUrl(websiteUri)) {
      await launchUrl(websiteUri);
    } else {
      CustomSnackbar.showError(message: 'Could not launch website.');
    }
  }
}
