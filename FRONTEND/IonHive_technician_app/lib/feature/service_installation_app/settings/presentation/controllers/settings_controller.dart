// feature/technician_app/settings/presentation/controllers/technician_settings_controller.dart
import 'dart:async';
import 'package:ionhive_technician_app/core/controllers/session_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/repositories/home_repository.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/domain/models/settings_model.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/domain/repositories/settings_repository.dart';
import 'package:ionhive_technician_app/utils/widgets/snackbar/custom_snackbar.dart';
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

  // Form controllers
  final editNameController = TextEditingController();
  final editPhoneController = TextEditingController();
  final editCityController = TextEditingController();
  final editAddress1Controller = TextEditingController();
  final editAddress2Controller = TextEditingController();
  final editDistrictController = TextEditingController();
  final editStateController = TextEditingController();
  final editCountryController = TextEditingController();
  final editPincodeController = TextEditingController();
  final editPasswordController = TextEditingController();

  // Original values for change detection
  String _originalName = '';
  String _originalPhone = '';
  String _originalCity = '';
  String _originalAddress1 = '';
  String _originalAddress2 = '';
  String _originalDistrict = '';
  String _originalState = '';
  String _originalCountry = '';
  String _originalPincode = '';
  String _originalPassword = '';

  final formKey = GlobalKey<FormState>();
  var isFormValid = false.obs;
  var isEditLoading = false.obs;

  // Error messages
  var nameError = ''.obs;
  var phoneError = ''.obs;
  var cityError = ''.obs;
  var address1Error = ''.obs;
  var districtError = ''.obs;
  var stateError = ''.obs;
  var countryError = ''.obs;
  var pincodeError = ''.obs;
  var passwordError = ''.obs;

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
  }

  @override
  void onClose() {
    editNameController.dispose();
    editPhoneController.dispose();
    editCityController.dispose();
    editAddress1Controller.dispose();
    editAddress2Controller.dispose();
    editDistrictController.dispose();
    editStateController.dispose();
    editCountryController.dispose();
    editPincodeController.dispose();
    editPasswordController.dispose();
    super.onClose();
  }

  void initializeEditForm() {
    if (technicianData.value != null) {
      _originalName = technicianData.value?.name ?? '';
      _originalPhone = technicianData.value?.phone.toString() ?? '';
      _originalCity = technicianData.value?.city ?? '';
      _originalAddress1 = technicianData.value?.addressline1 ?? '';
      _originalAddress2 = technicianData.value?.addressline2 ?? '';
      _originalDistrict = technicianData.value?.district ?? '';
      _originalState = technicianData.value?.state ?? '';
      _originalCountry = technicianData.value?.country ?? '';
      _originalPincode = technicianData.value?.pincode ?? '';
      _originalPassword = technicianData.value?.password?.toString() ?? '';

      editNameController.text = _originalName;
      editPhoneController.text = _originalPhone;
      editCityController.text = _originalCity;
      editAddress1Controller.text = _originalAddress1;
      editAddress2Controller.text = _originalAddress2;
      editDistrictController.text = _originalDistrict;
      editStateController.text = _originalState;
      editCountryController.text = _originalCountry;
      editPincodeController.text = _originalPincode;
      editPasswordController.text = _originalPassword;
    }
  }

  void validateForm() {
    final name = editNameController.text.trim();
    final phone = editPhoneController.text.trim();
    final city = editCityController.text.trim();
    final address1 = editAddress1Controller.text.trim();
    final district = editDistrictController.text.trim();
    final state = editStateController.text.trim();
    final country = editCountryController.text.trim();
    final pincode = editPincodeController.text.trim();
    final password = editPasswordController.text.trim();

    // Reset errors
    nameError.value = '';
    phoneError.value = '';
    cityError.value = '';
    address1Error.value = '';
    districtError.value = '';
    stateError.value = '';
    countryError.value = '';
    pincodeError.value = '';
    passwordError.value = '';

    // Name
    if (name.isEmpty) {
      nameError.value = 'Name is required';
    } else if (name.length < 3) {
      nameError.value = 'Name must be at least 3 characters';
    }

    // Phone
    if (phone.isEmpty) {
      phoneError.value = 'Phone number is required';
    } else if (phone.length != 10 || !RegExp(r'^[0-9]+$').hasMatch(phone)) {
      phoneError.value = 'Phone number must be exactly 10 digits';
    }

    // City
    if (city.isEmpty) {
      cityError.value = 'City is required';
    }

    // Address line 1
    if (address1.isEmpty) {
      address1Error.value = 'Address Line 1 is required';
    }

    // District
    if (district.isEmpty) {
      districtError.value = 'District is required';
    }

    // State
    if (state.isEmpty) {
      stateError.value = 'State is required';
    }

    // Country
    if (country.isEmpty) {
      countryError.value = 'Country is required';
    }

    // Pincode
    if (pincode.isEmpty) {
      pincodeError.value = 'Pincode is required';
    }

    // Password
    if (password.isEmpty) {
      passwordError.value = 'Password is required';
    } else if (password.length != 4 || !RegExp(r'^[0-9]+$').hasMatch(password)) {
      passwordError.value = 'Password must be exactly 4 digits';
    }

    // Check if all fields are valid
    final isValid = nameError.value.isEmpty &&
        phoneError.value.isEmpty &&
        cityError.value.isEmpty &&
        address1Error.value.isEmpty &&
        districtError.value.isEmpty &&
        stateError.value.isEmpty &&
        countryError.value.isEmpty &&
        pincodeError.value.isEmpty &&
        passwordError.value.isEmpty;

    // Check if there are any changes from original values
    final hasChanges = name != _originalName ||
        phone != _originalPhone ||
        city != _originalCity ||
        address1 != _originalAddress1 ||
        editAddress2Controller.text.trim() != _originalAddress2 ||
        district != _originalDistrict ||
        state != _originalState ||
        country != _originalCountry ||
        pincode != _originalPincode ||
        password != _originalPassword;

    isFormValid.value = isValid && hasChanges;
  }

  Future<void> fetchTechnicianDetails() async {
    try {
      isLoading(true);
      final response = await _settingsRepository
          .fetchUserDetails(Get.find<SessionController>().userId.value);
      if (!response.error && response.data != null) {
        errorMessage.value = '';
        technicianData.value = response.data;
        await Get.find<SessionController>().saveSession(
          userId: response.data!.userId,
          emailId: response.data!.email,
          token: Get.find<SessionController>().token.value,
          userRole: 2,
          username: response.data!.name,
          isSubscribed: response.data!.issubscribed,
          technicianId: Get.find<SessionController>().technicianId.value,
        );
        initializeEditForm();
        validateForm();
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
    required String addressline1,
    required String addressline2,
    required String city,
    required String district,
    required String state,
    required String country,
    required String pincode,
    required String password,
  }) async {
    try {
      isEditLoading(true);

      final response = await _settingsRepository.updateUserDetails(
        userId: Get.find<SessionController>().userId.value,
        email: technicianData.value?.email ?? '',
        name: name,
        phone: phone,
        addressline1: addressline1,
        addressline2: addressline2,
        city: city,
        district: district,
        state: state,
        country: country,
        pincode: pincode,
        password: password,
      );

      if (!response.error) {
        technicianData.value = technicianData.value?.copyWith(
          name: name,
          phone: phone,
          city: city,
          addressline1: addressline1,
          addressline2: addressline2,
          district: district,
          state: state,
          country: country,
          pincode: pincode,
          password: int.tryParse(password),
        );
        // Update original values after successful save
        initializeEditForm();
        validateForm();
        CustomSnackbar.showSuccess(message: 'Details updated successfully');
        await Future.delayed(const Duration(seconds: 2));
        Get.back();
      } else {
        CustomSnackbar.showError(
            message: 'Failed to update: ${response.message}');
      }
    } catch (e) {
      CustomSnackbar.showError(message: e.toString());
    } finally {
      isEditLoading(false);
    }
  }

  Future<void> saveChanges() async {
    if (!isFormValid.value || isEditLoading.value) return;

    isEditLoading(true);

    final name = editNameController.text.trim();
    final phoneText = editPhoneController.text.trim();
    final city = editCityController.text.trim();
    final address1 = editAddress1Controller.text.trim();
    final address2 = editAddress2Controller.text.trim();
    final district = editDistrictController.text.trim();
    final state = editStateController.text.trim();
    final country = editCountryController.text.trim();
    final pincode = editPincodeController.text.trim();
    final password = editPasswordController.text.trim();

    if (phoneText.length != 10 || !RegExp(r'^[0-9]+$').hasMatch(phoneText)) {
      phoneError.value = 'Phone number must be exactly 10 digits';
      isFormValid.value = false;
      isEditLoading(false);
      return;
    }

    final phoneNumber = int.tryParse(phoneText);
    if (phoneNumber == null) {
      phoneError.value = 'Invalid phone number';
      isFormValid.value = false;
      isEditLoading(false);
      return;
    }

    await updateTechnicianDetails(
      name: name,
      phone: phoneNumber,
      addressline1: address1,
      addressline2: address2,
      city: city,
      district: district,
      state: state,
      country: country,
      pincode: pincode,
      password: password,
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
