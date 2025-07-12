import 'package:aquapulse_app/core/controllers/session_controller.dart';
import 'package:aquapulse_app/core/services/base_api_service.dart';
import 'package:aquapulse_app/feature/end_user_app/settings/data/urls.dart';
import 'package:get/get.dart';

class SettingsApi extends BaseApiService {
  final SessionController _sessionController = Get.find<SessionController>();

  Future<Map<String, dynamic>> FetchUserDetails() async {
    final userId = _sessionController.userId.value;
    final email = _sessionController.emailId.value;

    return makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.FetchUserDetails.url,
      method: SettingsUrl.FetchUserDetails.method,
      body: {'user_id': userId, "email": email, "role_id": 3},
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> fetchPaymentHistory() async {
    final userId = _sessionController.userId.value;
    final email = _sessionController.emailId.value;

    return makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.fetchPaymentHistory.url,
      method: SettingsUrl.fetchPaymentHistory.method,
      body: {'user_id': userId, "email": email, "role_id": 3},
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> createServiceRequest({
    required int userId,
    required String email,
    required String task_description,
    String? deviceId,
  }) async {
    return makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.createServiceRequest.url,
      method: SettingsUrl.createServiceRequest.method,
      body: {
        'task_created_by_user_id': userId,
        'task_created_by_user_email': email,
        'role_id': 3,
        'task_description': task_description,
        'device_id': deviceId ?? '',
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> updateUserDetails({
    required int? userId,
    required String email,
    required String name,
    required int phone,
    required String city,
  }) async {
    return makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.UpdateUserDetails.url,
      method: SettingsUrl.UpdateUserDetails.method,
      body: {
        'user_id': userId,
        'email': email,
        'role_id': 3,
        'name': name,
        'phone': phone,
        'city': city,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> updateNotificationSettings({
    required int userId,
    required bool pushEnabled,
    required bool whatsappEnabled,
    required bool smsEnabled,
  }) async {
    return makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.UpdateNotificationSettings.url,
      method: SettingsUrl.UpdateNotificationSettings.method,
      body: {
        'user_id': userId,
        'push_enabled': pushEnabled,
        'whatsapp_enabled': whatsappEnabled,
        'sms_enabled': smsEnabled,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> saveMessage({
    required int userId,
    required Map<String, dynamic> message,
  }) async {
    return makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.UpdateNotificationSettings.url,
      method: SettingsUrl.UpdateNotificationSettings.method,
      body: {
        'user_id': userId,
        'message': message,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }
}
