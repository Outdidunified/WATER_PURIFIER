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
  final formKey = GlobalKey<FormState>();
  var isFormValid = false.obs;
  var isEditLoading = false.obs;

  // Error messages for each field
  var nameError = ''.obs;
  var phoneError = ''.obs;
  var cityError = ''.obs;

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
  var _isFormInitialized = false;

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
  var currentStep = Rx<String?>(null); // 'device_selection', 'description', 'direction', 'confirm'
  var taskDescription = Rx<String?>(null);
  var direction = Rx<String?>(null);
  var activeSubscriptions = RxList<home_models.Order>([]);
  var selectedDeviceId = Rx<String?>(null);

  final SettingsRepository _settingsRepository;
  final AIService _aiService;

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
    if (_isFormInitialized) return;

    editNameController.text = userData.value?.data.name ?? '';
    editPhoneController.text = userData.value?.data.phone?.toString() ?? '';
    editCityController.text = userData.value?.data.city ?? '';
    // initialize address fields
    editAddressLine1Controller.text = userData.value?.data.addressline1 ?? '';
    editAddressLine2Controller.text = userData.value?.data.addressline2 ?? '';
    editDistrictController.text = userData.value?.data.district ?? '';
    editStateController.text = userData.value?.data.state ?? '';
    editCountryController.text = userData.value?.data.country ?? '';
    editPincodeController.text = userData.value?.data.pincode ?? '';
    validateForm();
    _isFormInitialized = true;
  }

  void validateForm() {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      final name = editNameController.text.trim();
      final phone = editPhoneController.text.trim();
      final city = editCityController.text.trim();

      // Reset error messages
      nameError.value = '';
      phoneError.value = '';
      cityError.value = '';

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

      // Update form validity
      isFormValid.value = nameError.value.isEmpty &&
          phoneError.value.isEmpty &&
          cityError.value.isEmpty;
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
        );

        // Initialize the form fields with user data after successful fetch
        _isFormInitialized = false; // Reset to ensure form gets initialized
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
}) async {
  try {
    isEditLoading(true);

    final cleanPhone = phone.replaceAll(RegExp(r'[^0-9]'), '');
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
        pincode == (currentData.pincode ?? '')) {
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
    );

    if (response.error == false && response.data != null) {
      final Map<String, dynamic> safeData = {
        'user_id': response.data?['user_id'] ?? userId,
        'name': response.data?['name'] ?? name,
        'email': response.data?['email'] ?? email,
        'phone': response.data?['phone'] ?? phoneInt,
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

      userData.value = UserDetailsModel.fromJson({
        'error': false,
        'message': response.message ?? 'User details updated successfully',
        'data': safeData,
      });

      CustomSnackbar.showSuccess(message: 'User details updated successfully');
      await Future.delayed(const Duration(seconds: 2));
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
        currentStep.value = 'direction';
        final botMessage = MessageModel(
          text: 'Please provide the direction or location details.',
          isBot: true,
          timestamp: DateTime.now(),
        );
        isTyping.value = false;
        messages.add(botMessage);
        scrollToBottom();
      } else if (currentStep.value == 'direction') {
        direction.value = text;
        currentStep.value = 'confirm';
        final botMessage = MessageModel(
          text:
              'Please review your details:\nDescription: ${taskDescription.value}\nDirection: ${direction.value}\nDo you want to submit this request?',
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
    direction.value = null; // Reset direction
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
      final deviceId = selectedDeviceId.value ?? DevucData.value?.deviceId ?? '';

      String taskDesc = taskDescription.value ?? '';
      if (deviceId.isNotEmpty) {
        taskDesc += '\nDevice ID: $deviceId';
      }
      if (direction.value != null && direction.value!.isNotEmpty) {
        taskDesc += '\nDirection: ${direction.value}';
      }

      final response = await _settingsRepository.createServiceRequest(
        userId: userId,
        userEmail: userEmail,
        taskDescription: taskDesc,
        deviceId: deviceId,
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
      direction.value = null;
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
    direction.value = null;
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
