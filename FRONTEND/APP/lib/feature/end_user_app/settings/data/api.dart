import 'package:flutter/material.dart';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/core/services/base_api_service.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/data/urls.dart';
import 'package:get/get.dart';
import 'package:ionhive_water_purifier/core/core.dart';

class SettingsApi extends BaseApiService {
  final SessionController _sessionController = Get.find<SessionController>();

  Future<Map<String, dynamic>> FetchUserDetails() async {
    final userId = _sessionController.userId.value;
    final email = _sessionController.emailId.value;

    final response = await makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.FetchUserDetails.url,
      method: SettingsUrl.FetchUserDetails.method,
      body: {'user_id': userId, "email": email, "role_id": 3},
      responseParser: (data) => data as Map<String, dynamic>,
    );
    
    // Debug: Log the raw response
    debugPrint('🔍 API Raw Response: $response');
    if (response['data'] != null) {
      debugPrint('🔍 API Data Password: ${response['data']['password']}');
    }
    
    return response;
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
    String? wpDeviceId,
    String? modelName,
  }) async {
    return makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.createServiceRequest.url,
      method: SettingsUrl.createServiceRequest.method,
      body: {
        'task_created_by_user_id': userId,
        'task_created_by_user_email': email,
        'role_id': 3,
        'task_description': task_description,
        'wp_device_id': wpDeviceId ?? '',
        'modelName': modelName ?? '',
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> updateUserDetails({
    required int? userId,
    required String email,
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
    final Map<String, dynamic> body = {
      'user_id': userId,
      'email': email,
      'role_id': 3,
      'name': name,
      'phone': phone,
      'addressline1': addressline1,
      'addressline2': addressline2,
      'city': city,
      'district': district,
      'state': state,
      'country': country,
      'pincode': pincode,
      'password': int.parse(password),
    };
    
    return makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.UpdateUserDetails.url,
      method: SettingsUrl.UpdateUserDetails.method,
      body: body,
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

  Future<Map<String, dynamic>> fetchActiveSubscriptions() async {
    final userId = _sessionController.userId.value;
    final email = _sessionController.emailId.value;

    return makeRequest<Map<String, dynamic>>(
      url: '${Core.baseUrl}/api/app/enduserhome/getActiveSubscriptionDetails',
      method: 'POST',
      body: {'user_id': userId, "email": email, "role_id": 3},
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }
}
