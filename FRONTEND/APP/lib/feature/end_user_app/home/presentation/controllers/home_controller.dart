import 'package:aquapulse_app/feature/end_user_app/home/domain/repositories/home_repository.dart';
import 'package:get/get.dart';
import 'package:aquapulse_app/feature/end_user_app/home/domain/models/home_model.dart';
import 'package:aquapulse_app/feature/end_user_app/home/domain/models/device_model.dart';
import 'package:aquapulse_app/core/controllers/session_controller.dart';

class SubscriptionController extends GetxController {
  final SubscriptionRepository _repository = SubscriptionRepository();

  Rx<Subscription?> activeSubscription = Rx<Subscription?>(null);
  Rx<DeviceData?> deviceData = Rx<DeviceData?>(null);
  RxBool isLoading = false.obs;
  RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    fetchActiveSubscription();
    fetchLatestFeatureValues();
  }

  Future<void> fetchActiveSubscription() async {
    isLoading.value = true;
    // Don't clear error message until we have a successful response
    // This allows us to keep showing the error banner with cached data

    try {
      final response = await _repository.getActiveSubscription();
      final sessionController = Get.find<SessionController>();

      if (!response.error) {
        // Clear error message on success
        errorMessage.value = '';

        // Check if subscription data is null (user is not subscribed)
        if (response.data == null || response.data?.subscription == null) {
          // Update session controller to reflect user is not subscribed
          activeSubscription.value = null;
          await sessionController.saveSession(
            userId: sessionController.userId.value,
            emailId: sessionController.emailId.value,
            token: sessionController.token.value,
            userRole: sessionController.userRole.value,
            isSubscribed: false,
            username: sessionController.username.value,
            technicianId: sessionController.technicianId.value,
          );
        } else {
          // User has an active subscription
          activeSubscription.value = response.data?.subscription;
          await sessionController.saveSession(
            userId: sessionController.userId.value,
            emailId: sessionController.emailId.value,
            token: sessionController.token.value,
            userRole: sessionController.userRole.value,
            isSubscribed: true,
            username: sessionController.username.value,
            technicianId: sessionController.technicianId.value,
          );
        }
      } else {
        // Error in response - set error message but don't clear existing data
        errorMessage.value = response.message;
        // On error, don't change subscription status
      }
    } catch (e) {
      // Set error message but don't clear existing data
      errorMessage.value = "Note: $e";
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchLatestFeatureValues() async {
    isLoading.value = true;
    // Don't clear error message until we have a successful response
    // This allows us to keep showing the error banner with cached data

    try {
      // Get the session controller to access the user ID
      final sessionController = Get.find<SessionController>();

      // Get the device ID from the active subscription if available
      String deviceId = "";
      if (activeSubscription.value != null) {
        deviceId = activeSubscription.value!.wpDeviceId;
      }

      // Only proceed if we have a valid device ID
      if (deviceId.isEmpty) {
        if (errorMessage.value.isEmpty) {
          errorMessage.value =
              "No active device found. Please check your subscription.";
        }
        isLoading.value = false;
        return;
      }

      final response = await _repository.getLatestFeatureValues(
        userId: sessionController.userId.value,
        wpDeviceId: deviceId,
      );

      if (!response.error) {
        // Only update device data if we got new data
        if (response.data != null) {
          deviceData.value = response.data;
          // Clear error message on success only if fetchActiveSubscription didn't set one
          if (errorMessage.value.contains('feature values')) {
            errorMessage.value = '';
          }
        }
      } else {
        // Set error message but don't clear existing data
        // Only set error if active subscription fetch didn't already set one
        if (errorMessage.value.isEmpty) {
          errorMessage.value = response.message;
        }
      }
    } catch (e) {
      // Set error message but don't clear existing data
      // Only set error if active subscription fetch didn't already set one
      if (errorMessage.value.isEmpty) {
        errorMessage.value = "Note: $e";
      }
    } finally {
      isLoading.value = false;
    }
  }
}
