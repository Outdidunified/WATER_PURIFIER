import 'package:aquapulse_app/core/controllers/session_controller.dart';
import 'package:aquapulse_app/core/services/base_api_service.dart';
import 'package:aquapulse_app/feature/service_installation_app/settings/data/urls.dart';
import 'package:get/get.dart';

class SettingsApi extends BaseApiService {
  final SessionController _sessionController = Get.find<SessionController>();

  Future<Map<String, dynamic>> fetchUserDetails() async {
    final userId = _sessionController.userId.value;
    final email = _sessionController.emailId.value;

    return makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.FetchUserDetails.url,
      method: SettingsUrl.FetchUserDetails.method,
      body: {'user_id': userId, "email": email, "role_id": 2},
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> updateUserDetails({
    required int userId,
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
        'role_id': 2,
        'name': name,
        'phone': phone,
        'city': city,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }
}
