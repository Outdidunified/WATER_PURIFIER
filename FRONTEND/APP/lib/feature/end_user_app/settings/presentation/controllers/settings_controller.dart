import 'dart:async';
import 'dart:io';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/device_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/home_model.dart' as home_models;
import 'package:ionhive_water_purifier/feature/end_user_app/home/presentation/controllers/home_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/presentation/controllers/subscription_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/domain/models/payment_history_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/domain/repositories/settings_repository.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/domain/models/settings_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/domain/models/message_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/pages/ContactSupportPage/ai_service.dart';
import 'package:ionhive_water_purifier/utils/widgets/snackbar/custom_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';

class SettingsController extends GetxController {
  final SessionController _sessionController = Get.find<SessionController>();

  var userData = Rx<UserDetailsModel?>(null);
  var DevucData = Rx<DeviceData?>(null);

  var isLoading = true.obs;
  var errorMessage = ''.obs;

  final editNameController = TextEditingController();
  final editPhoneController = TextEditingController();
  final editCityController = TextEditingController();
  // New address controllers
  final editAddressLine1Controller = TextEditingController();
  final editAddressLine2Controller = TextEditingController();
  final editDistrictController = TextEditingController();
  final editStateController = TextEditingController();
  final editCountryController = TextEditingController();
  final editPincodeController = TextEditingController();
  // Password controller
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

  // Error messages for each field
  var nameError = ''.obs;
  var phoneError = ''.obs;
  var cityError = ''.obs;
  var passwordError = ''.obs;

  var paymentHistoryList = <PaymentHistory>[].obs;
  // Add reactive list for delivery address visibility
  var deliveryAddressVisibility = <bool>[].obs;
  // Notification settings
  var pushNotificationsEnabled = true.obs;
  var whatsAppNotificationsEnabled = false.obs;
  var smsNotificationsEnabled = false.obs;
  var isSavingNotifications = false.obs;
  var hasSubmitted = false.obs; // New: Track if submission has occurred

  Timer? _debounce;
  Timer? _saveDebounce;

  // Method to toggle visibility at a specific index
  void toggleDeliveryAddressVisibility(int index) {
    if (index < deliveryAddressVisibility.length) {
      deliveryAddressVisibility[index] = !deliveryAddressVisibility[index];
    }
  }

  // Contact Support Page State
  var messages = RxList<MessageModel>([
    MessageModel(
      text: 'Hello! How can I assist you today?\nPlease select an option:',
      isBot: true,
      timestamp: DateTime.now(),
      showOptions: true,
    ),
  ]);
  final messageController = TextEditingController();
  final scrollController = ScrollController();
  final ImagePicker _imagePicker = ImagePicker();
  var selectedFile = Rx<File?>(null);
  var isCollectingServiceRequest = false.obs;
  var isSubmitting = false.obs;
  var isTyping = false.obs; // For typing indicator
  var currentStep = Rx<String?>(null); // 'device_selection', 'description', 'confirm'
  var taskDescription = Rx<String?>(null);
  var direction = Rx<String?>(null);
  var activeSubscriptions = RxList<home_models.Order>([]);
  var selectedDeviceId = Rx<String?>(null);

  final SettingsRepository _settingsRepository;
  final AIService _aiService;

  /// Get only smart model subscriptions with task_type 1 and task_status Completed
  List<home_models.Order> get completedSubscriptions {
    return activeSubscriptions
        .where((subscription) =>
            subscription.modelType?.toLowerCase() == 'smart' &&
            subscription.tasks.any((task) =>
                task.taskType == 1 &&
                task.taskStatus.trim().toLowerCase() == 'completed'))
        .toList();
  }

  SettingsController({
    SettingsRepository? settingsRepository,
    AIService? aiService,
  })  : _settingsRepository = settingsRepository ?? SettingsRepository(),
        _aiService = aiService ?? AIService();

  @override
  void onInit() {
    super.onInit();
    fetchUserDetails();
    fetchPaymentHistory();
    getDeviceData();
    fetchActiveSubscriptions();
  }

  // Get device data from the home controller
  void getDeviceData() {
    try {
      // Try to find the subscription controller to get device data
      final subscriptionController = Get.find<SubscriptionController>();
      if (subscriptionController.deviceData.value != null) {
        DevucData.value = subscriptionController.deviceData.value;
        debugPrint('Device ID: ${DevucData.value?.deviceId}');
      } else {
        debugPrint('No device data available');
      }
    } catch (e) {
      debugPrint('Error getting device data: $e');
    }
  }

  // Fetch active subscriptions for device selection
  Future<void> fetchActiveSubscriptions() async {
    try {
      final response = await _settingsRepository.fetchActiveSubscriptions();
      if (response.error == false && response.data != null) {
        activeSubscriptions.assignAll(response.data!);
        debugPrint('Fetched ${activeSubscriptions.length} active subscriptions');
      } else {
        debugPrint('Error fetching active subscriptions: ${response.message}');
        activeSubscriptions.clear();
      }
    } catch (e) {
      debugPrint('Error fetching active subscriptions: $e');
      activeSubscriptions.clear();
    }
  }

  @override
  void onClose() {
    messageController.dispose();
    scrollController.dispose();
    _debounce?.cancel();
    _saveDebounce?.cancel();
    super.onClose();
  }

  void initializeEditForm() {
    if (userData.value == null) return;

    // Store original values for change detection
    _originalName = userData.value?.data.name ?? '';
    _originalPhone = userData.value?.data.phone?.toString() ?? '';
    _originalCity = userData.value?.data.city ?? '';
    _originalAddress1 = userData.value?.data.addressline1 ?? '';
    _originalAddress2 = userData.value?.data.addressline2 ?? '';
    _originalDistrict = userData.value?.data.district ?? '';
    _originalState = userData.value?.data.state ?? '';
    _originalCountry = userData.value?.data.country ?? '';
    _originalPincode = userData.value?.data.pincode ?? '';
    _originalPassword = userData.value?.data.password?.toString() ?? '';

    // If password from backend is null, use from session
    final sessionController = Get.find<SessionController>();
    if (_originalPassword.isEmpty && sessionController.password.value.isNotEmpty) {
      _originalPassword = sessionController.password.value;
    }

    // Debug: Check password value
    debugPrint('🔐 Password from backend: ${userData.value?.data.password}');
    debugPrint('🔐 Password from session: ${sessionController.password.value}');
    debugPrint('🔐 Original password string: $_originalPassword');

    // Initialize controllers with original values
    editNameController.text = _originalName;
    editPhoneController.text = _originalPhone;
    editCityController.text = _originalCity;
    editAddressLine1Controller.text = _originalAddress1;
    editAddressLine2Controller.text = _originalAddress2;
    editDistrictController.text = _originalDistrict;
    editStateController.text = _originalState;
    editCountryController.text = _originalCountry;
    editPincodeController.text = _originalPincode;
    editPasswordController.text = _originalPassword;

    // Debug: Verify password controller was set
    debugPrint('🔐 Password controller text: ${editPasswordController.text}');

    validateForm();
  }

  void validateForm() {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      final name = editNameController.text.trim();
      final phone = editPhoneController.text.trim();
      final city = editCityController.text.trim();
      final address1 = editAddressLine1Controller.text.trim();
      final address2 = editAddressLine2Controller.text.trim();
      final district = editDistrictController.text.trim();
      final state = editStateController.text.trim();
      final country = editCountryController.text.trim();
      final pincode = editPincodeController.text.trim();
      final password = editPasswordController.text.trim();

      // Reset error messages
      nameError.value = '';
      phoneError.value = '';
      cityError.value = '';
      passwordError.value = '';

      // Validate each field
      if (name.isEmpty) {
        nameError.value = 'Username is required';
      } else if (name.length < 3) {
        nameError.value = 'Username must be at least 3 characters';
      }

      if (phone.isEmpty) {
        phoneError.value = 'Phone number is required';
      } else if (phone.length != 10 || !RegExp(r'^[0-9]+$').hasMatch(phone)) {
        phoneError.value = 'Phone number must be exactly 10 digits';
      }

      if (city.isEmpty) {
        cityError.value = 'City is required';
      } else if (city.length < 2) {
        cityError.value = 'City must be at least 2 characters';
      }

      // Validate password - must be exactly 4 digits
      if (password.isEmpty) {
        passwordError.value = 'Password is required';
      } else if (password.length != 4 || !RegExp(r'^[0-9]+$').hasMatch(password)) {
        passwordError.value = 'Password must be exactly 4 digits';
      }

      // Check if all fields are valid
      final isValid = nameError.value.isEmpty &&
          phoneError.value.isEmpty &&
          cityError.value.isEmpty &&
          passwordError.value.isEmpty;

      // Check if there are any changes from original values
      final hasChanges = name != _originalName ||
          phone != _originalPhone ||
          city != _originalCity ||
          address1 != _originalAddress1 ||
          address2 != _originalAddress2 ||
          district != _originalDistrict ||
          state != _originalState ||
          country != _originalCountry ||
          pincode != _originalPincode ||
          password != _originalPassword;

      // Update form validity - enable button if there are ANY changes
      // Validation errors will still show, but user can attempt to save
      isFormValid.value = hasChanges;
    });
  }

  Future<void> fetchUserDetails() async {
    try {
      isLoading(true);
      final response = await _settingsRepository.FetchUserDetails();
      if (response.error == false && response.data != null) {
        errorMessage.value = '';
        userData.value = response.data;
        final sessionController = Get.find<SessionController>();
        await sessionController.saveSession(
          userId: sessionController.userId.value,
          emailId: sessionController.emailId.value,
          token: sessionController.token.value,
          userRole: sessionController.userRole.value,
          username: response.data!.data.name,
          isSubscribed: response.data!.data.isSubscribed,
          technicianId: sessionController.technicianId.value,
          password: response.data!.data.password?.toString(),
        );

        // Initialize the form fields with user data after successful fetch
        initializeEditForm();
      } else {
        errorMessage.value = response.message ?? 'No user details found';
        CustomSnackbar.showError(message: errorMessage.value);
      }
    } catch (e) {
      errorMessage.value = e.toString();
    } finally {
      isLoading(false);
    }
  }

  Future<void> fetchPaymentHistory() async {
    try {
      isLoading(true);
      final response = await _settingsRepository.getPaymentHistory();
      if (response.error == false && response.data != null) {
        if (response.data!.isNotEmpty) {
          paymentHistoryList.assignAll(response.data!);
          if (errorMessage.value.contains('No payment history found')) {
            errorMessage.value = '';
          }
        }
      } else {
        if (errorMessage.value.isEmpty) {
          errorMessage.value = response.message ?? 'No payment history found';
        }
      }
    } catch (e) {
      if (errorMessage.value.isEmpty) {
        errorMessage.value = e.toString();
      }
    } finally {
      isLoading(false);
    }
  }

// Updated updateUserDetails in SettingsController
  Future<void> updateUserDetails({
  required int? userId,
  required String email,
  required String name,
  required String phone,
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

    // Validate required fields before attempting to save
    if (name.trim().isEmpty) {
      CustomSnackbar.showError(message: 'Username is required');
      isEditLoading(false);
      return;
    }
    if (name.trim().length < 3) {
      CustomSnackbar.showError(message: 'Username must be at least 3 characters');
      isEditLoading(false);
      return;
    }
    if (phone.trim().isEmpty) {
      CustomSnackbar.showError(message: 'Phone number is required');
      isEditLoading(false);
      return;
    }
    if (city.trim().isEmpty) {
      CustomSnackbar.showError(message: 'City is required');
      isEditLoading(false);
      return;
    }
    if (city.trim().length < 2) {
      CustomSnackbar.showError(message: 'City must be at least 2 characters');
      isEditLoading(false);
      return;
    }

    final cleanPhone = phone.replaceAll(RegExp(r'[^0-9]'), '');
    
    if (cleanPhone.length != 10) {
      CustomSnackbar.showError(message: 'Phone number must be exactly 10 digits');
      isEditLoading(false);
      return;
    }
    
    // Validate password (required field)
    if (password.isEmpty) {
      CustomSnackbar.showError(message: 'Password is required');
      isEditLoading(false);
      return;
    }
    if (password.length != 4 || !RegExp(r'^[0-9]+$').hasMatch(password)) {
      CustomSnackbar.showError(message: 'Password must be exactly 4 digits');
      isEditLoading(false);
      return;
    }
    
    final phoneInt = int.parse(cleanPhone);

    // Check if any change
    final currentData = userData.value?.data;
    if (currentData != null &&
        name == (currentData.name ?? '') &&
        cleanPhone == (currentData.phone?.toString() ?? '') &&
        city == (currentData.city ?? '') &&
        addressline1 == (currentData.addressline1 ?? '') &&
        addressline2 == (currentData.addressline2 ?? '') &&
        district == (currentData.district ?? '') &&
        state == (currentData.state ?? '') &&
        country == (currentData.country ?? '') &&
        pincode == (currentData.pincode ?? '') &&
        password == (currentData.password?.toString() ?? '')) {
      CustomSnackbar.showInfo(message: 'No changes made to update.');
      isEditLoading(false);
      return;
    }

    final response = await _settingsRepository.updateUserDetails(
      userId: userId,
      email: email,
      name: name,
      phone: phoneInt,
      addressline1: addressline1,
      addressline2: addressline2,
      city: city,
      district: district,
      state: state,
      country: country,
      pincode: pincode,
      password: password,
    );

    if (response.error == false && response.data != null) {
      debugPrint('✅ Update successful - Password being saved: $password');
      
      debugPrint('✅ Update successful - Password being saved: $password');
      
      final Map<String, dynamic> safeData = {
        'user_id': response.data?['user_id'] ?? userId,
        'name': response.data?['name'] ?? name,
        'email': response.data?['email'] ?? email,
        'phone': response.data?['phone'] ?? phoneInt,
        'password': response.data?['password'] ?? int.parse(password),
        'password': response.data?['password'] ?? int.parse(password),
        'addressline1': response.data?['addressline1'] ?? addressline1,
        'addressline2': response.data?['addressline2'] ?? addressline2,
        'city': response.data?['city'] ?? city,
        'district': response.data?['district'] ?? district,
        'state': response.data?['state'] ?? state,
        'country': response.data?['country'] ?? country,
        'pincode': response.data?['pincode'] ?? pincode,
        'status': currentData?.status ?? true,
        'is_subscribed': currentData?.isSubscribed ?? false,
        'createdDate':
            currentData?.createdDate.toIso8601String() ?? DateTime.now().toIso8601String(),
        'modifiedDate': response.data?['modifiedDate'] ?? DateTime.now().toIso8601String(),
      };
      
      debugPrint('✅ SafeData password: ${safeData['password']}');
      
      debugPrint('✅ SafeData password: ${safeData['password']}');

      userData.value = UserDetailsModel.fromJson({
        'error': false,
        'message': response.message ?? 'User details updated successfully',
        'data': safeData,
      });

      // Save updated password to session
      final sessionController = Get.find<SessionController>();
      await sessionController.saveSession(
        userId: sessionController.userId.value,
        emailId: sessionController.emailId.value,
        token: sessionController.token.value,
        userRole: sessionController.userRole.value,
        username: userData.value!.data.name,
        isSubscribed: userData.value!.data.isSubscribed,
        technicianId: sessionController.technicianId.value,
        password: userData.value!.data.password?.toString(),
      );

      CustomSnackbar.showSuccess(message: 'User details updated successfully');
      await Future.delayed(const Duration(milliseconds: 1500));
      Get.back();
    } else {
      CustomSnackbar.showError(
          message: 'Issue while updating your account: ${response.message}');
    }
  } catch (e) {
    CustomSnackbar.showError(message: e.toString());
  } finally {
    isEditLoading(false);
  }
}

  Future<void> saveChanges() async {
    if (_saveDebounce?.isActive ?? false) return;

    _saveDebounce = Timer(const Duration(milliseconds: 500), () async {
      if (!isFormValid.value || isEditLoading.value) return;

      isEditLoading(true);

      final userData = this.userData.value!.data;
      await updateUserDetails(
        userId: userData.userId,
        email: userData.email,
        name: editNameController.text.trim(),
        phone: editPhoneController.text.trim(),
        addressline1: editAddressLine1Controller.text.trim(),
        addressline2: editAddressLine2Controller.text.trim(),
        city: editCityController.text.trim(),
        district: editDistrictController.text.trim(),
        state: editStateController.text.trim(),
        country: editCountryController.text.trim(),
        pincode: editPincodeController.text.trim(),
        password: editPasswordController.text.trim(),
      );
    });
  }

  // Notification settings methods
  void togglePushNotifications(bool value) {
    pushNotificationsEnabled.value = value;
    saveNotificationSettings();
  }

  void toggleWhatsAppNotifications(bool value) {
    whatsAppNotificationsEnabled.value = value;
    saveNotificationSettings();
  }

  void toggleSmsNotifications(bool value) {
    smsNotificationsEnabled.value = value;
    saveNotificationSettings();
  }

  Future<void> saveNotificationSettings() async {
    if (isSavingNotifications.value) return;

    try {
      isSavingNotifications(true);
      final sessionController = Get.find<SessionController>();
      final userId = sessionController.userId.value;

      final response = await _settingsRepository.updateNotificationSettings(
        userId: userId,
        pushEnabled: pushNotificationsEnabled.value,
        whatsappEnabled: whatsAppNotificationsEnabled.value,
        smsEnabled: smsNotificationsEnabled.value,
      );

      if (response.error == false) {
        CustomSnackbar.showSuccess(message: 'Notification settings updated');
      } else {
        CustomSnackbar.showError(
            message:
                'Failed to update notification settings: ${response.message}');
      }
    } catch (e) {
      CustomSnackbar.showError(message: e.toString());
    } finally {
      isSavingNotifications(false);
    }
  }

  // Helper method to scroll to the bottom of the chat
  void scrollToBottom() {
    if (scrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        scrollController.animateTo(
          scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    }
  }

  // Contact Support Page Methods
  Future<void> sendMessage([String? messageText]) async {
    final text = messageText ?? messageController.text.trim();
    if (text.isEmpty) return;

    final userMessage = MessageModel(
      text: text,
      isBot: false,
      timestamp: DateTime.now(),
    );
    messages.add(userMessage);
    scrollToBottom();

    messageController.clear();

    if (isCollectingServiceRequest.value) {
      isTyping.value = true;
      await Future.delayed(const Duration(milliseconds: 800));

      if (currentStep.value == 'description') {
        taskDescription.value = text;
        currentStep.value = 'confirm';
        final botMessage = MessageModel(
          text:
              'Please review your details:\nDescription: ${taskDescription.value}\n\nDo you want to submit this request?',
          isBot: true,
          timestamp: DateTime.now(),
          showConfirmButtons: true,
        );
        isTyping.value = false;
        messages.add(botMessage);
        scrollToBottom();
      }
    } else {
      isTyping.value = true;

      try {
        await Future.delayed(const Duration(milliseconds: 1500));

        final botResponseText = await _aiService.generateResponse(text);
        bool showOptions = false;
        bool showContactOptions = false;
        bool showConfirmButtons = false;

        if (botResponseText.toLowerCase().contains('how can i assist') ||
            botResponseText.toLowerCase().contains('help you today')) {
          showOptions = true;
        } else if (botResponseText.toLowerCase().contains('contact')) {
          showContactOptions = true;
        } else if (botResponseText.toLowerCase().contains('service ticket') ||
            botResponseText.toLowerCase().contains('description')) {
          isCollectingServiceRequest.value = true;
          currentStep.value = 'description';
        }

        isTyping.value = false;

        final botMessage = MessageModel(
          text: botResponseText,
          isBot: true,
          timestamp: DateTime.now(),
          showOptions: showOptions,
          showContactOptions: showContactOptions,
          showConfirmButtons: showConfirmButtons,
        );
        messages.add(botMessage);
        scrollToBottom();
      } catch (e) {
        isTyping.value = false;

        final errorMessage = MessageModel(
          text: 'Sorry, I encountered an error: $e',
          isBot: true,
          timestamp: DateTime.now(),
        );
        messages.add(errorMessage);
        scrollToBottom();
      }
    }
  }

  Future<void> handleContactSupport() async {
    isTyping.value = true;
    await Future.delayed(const Duration(milliseconds: 800));

    final botMessage = MessageModel(
      text: 'You can contact our support team through the following channels:',
      isBot: true,
      timestamp: DateTime.now(),
      showContactOptions: true,
    );
    isTyping.value = false;
    messages.add(botMessage);
    scrollToBottom();
  }

  void handleRaiseTicket() {
    isCollectingServiceRequest.value = true;
    currentStep.value = 'device_selection';
    hasSubmitted.value = false; // Reset submission flag for new request
    isSubmitting.value = false; // Reset submitting flag
    selectedDeviceId.value = null; // Reset selected device
    taskDescription.value = null; // Reset description
    final botMessage = MessageModel(
      text: 'Please select the device for which you need service.',
      isBot: true,
      timestamp: DateTime.now(),
      showDeviceSelection: true,
    );
    messages.add(botMessage);
    scrollToBottom();
  }

  void selectDevice(String deviceId) {
    selectedDeviceId.value = deviceId;
    currentStep.value = 'description';
    final botMessage = MessageModel(
      text: 'Please provide a description of the issue.',
      isBot: true,
      timestamp: DateTime.now(),
    );
    messages.add(botMessage);
    scrollToBottom();
  }

  Future<void> submitServiceRequest() async {
    if (hasSubmitted.value) return; // Prevent further submissions
    isSubmitting.value = true;
    hasSubmitted.value = true; // Mark as submitted
    final submittingMessage = MessageModel(
      text: 'Submitting your request...',
      isBot: true,
      timestamp: DateTime.now(),
    );
    messages.add(submittingMessage);
    // Update last message to hide confirmation buttons
    if (messages.isNotEmpty && messages.last.showConfirmButtons) {
      messages[messages.length - 2] = messages[messages.length - 2].copyWith(
        showConfirmButtons: false,
      );
    }
    scrollToBottom();

    try {
      final userId = _sessionController.userId.value;
      final userEmail = _sessionController.emailId.value;

      final selectedId = selectedDeviceId.value;
      var wpDeviceId = '';
      var modelName = '';

      if (selectedId != null) {
        final selectedSubscription = completedSubscriptions.firstWhere(
          (sub) => sub.wpDeviceId == selectedId,
          orElse: () => null as dynamic,
        );
        if (selectedSubscription != null) {
          wpDeviceId = selectedSubscription.wpDeviceId ?? '';
          modelName = selectedSubscription.modelName ?? '';
        }
      }

      String taskDesc = taskDescription.value ?? '';
      if (wpDeviceId.isNotEmpty) {
        taskDesc += '\nDevice ID: $wpDeviceId';
      }

      final response = await _settingsRepository.createServiceRequest(
        userId: userId,
        userEmail: userEmail,
        taskDescription: taskDesc,
        wpDeviceId: wpDeviceId,
        modelName: modelName,
      );

      if (response.error == false) {
        final successMessage = MessageModel(
          text:
              'Service request created successfully! Ticket ID: ${response.data?.taskId ?? "N/A"}\n\nAn email confirmation has been sent to your registered email address. Our support team will reach out to you shortly to address your issue. Thank you for your patience.',
          isBot: true,
          timestamp: DateTime.now(),
        );
        messages.add(successMessage);
        scrollToBottom();
      } else {
        final errorMessage = MessageModel(
          text: 'Failed to create service request: ${response.message}',
          isBot: true,
          timestamp: DateTime.now(),
        );
        messages.add(errorMessage);
        scrollToBottom();
        CustomSnackbar.showError(
            message: 'Failed to create service request: ${response.message}');
      }
    } catch (e) {
      final errorMessage = MessageModel(
        text: 'An error occurred: $e',
        isBot: true,
        timestamp: DateTime.now(),
      );
      messages.add(errorMessage);
      scrollToBottom();
      CustomSnackbar.showError(message: 'An error occurred: $e');
    } finally {
      isSubmitting.value = false;
      isCollectingServiceRequest.value = false;
      currentStep.value = null;
      taskDescription.value = null;
      selectedDeviceId.value = null;
    }
  }

  void cancelServiceRequest() {
    final botMessage = MessageModel(
      text:
          'Service request cancelled. Is there anything else we can help you with?',
      isBot: true,
      timestamp: DateTime.now(),
      showOptions: true,
    );
    // Update last message to hide confirmation buttons
    if (messages.isNotEmpty && messages.last.showConfirmButtons) {
      messages[messages.length - 1] = messages.last.copyWith(
        showConfirmButtons: false,
      );
    }
    messages.add(botMessage);
    scrollToBottom();
    isCollectingServiceRequest.value = false;
    currentStep.value = null;
    taskDescription.value = null;
    selectedDeviceId.value = null;
  }

  Future<void> launchEmail() async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: 'info@outdidunified.com',
      query: 'subject=Support%20Request',
    );
    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    } else {
      final errorMessage = MessageModel(
        text: 'Could not launch email client.',
        isBot: true,
        timestamp: DateTime.now(),
      );
      messages.add(errorMessage);
    }
  }

  Future<void> launchWhatsApp() async {
    final Uri whatsappUri =
        Uri.parse('https://wa.me/9972071514?text=Hello%20Support%20Team');
    if (await canLaunchUrl(whatsappUri)) {
      await launchUrl(whatsappUri);
    } else {
      final errorMessage = MessageModel(
        text: 'Could not launch WhatsApp.',
        isBot: true,
        timestamp: DateTime.now(),
      );
      messages.add(errorMessage);
    }
  }

  Future<void> launchPhone() async {
    final Uri phoneUri = Uri.parse('tel:+919972071514');
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    } else {
      final errorMessage = MessageModel(
        text: 'Could not launch phone dialer.',
        isBot: true,
        timestamp: DateTime.now(),
      );
      messages.add(errorMessage);
    }
  }

  Future<void> pickImage() async {
    final XFile? image =
        await _imagePicker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      selectedFile.value = File(image.path);
      final userMessage = MessageModel(
        text: 'Image sent',
        isBot: false,
        timestamp: DateTime.now(),
        file: selectedFile.value,
      );
      messages.add(userMessage);
    }
  }

  Future<void> pickFile() async {
    final FilePickerResult? result = await FilePicker.platform.pickFiles();
    if (result != null && result.files.single.path != null) {
      selectedFile.value = File(result.files.single.path!);
      final userMessage = MessageModel(
        text: 'File sent: ${result.files.single.name}',
        isBot: false,
        timestamp: DateTime.now(),
        file: selectedFile.value,
      );
      messages.add(userMessage);
    }
  }

  void showAttachmentOptions() {
    Get.bottomSheet(
      SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo),
              title: const Text('Photo'),
              onTap: () {
                Get.back();
                pickImage();
              },
            ),
            ListTile(
              leading: const Icon(Icons.description),
              title: const Text('Document'),
              onTap: () {
                Get.back();
                pickFile();
              },
            ),
          ],
        ),
      ),
      backgroundColor: Colors.white,
    );
  }
}
