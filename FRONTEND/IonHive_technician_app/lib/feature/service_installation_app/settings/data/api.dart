import 'package:ionhive_technician_app/core/controllers/session_controller.dart';
import 'package:ionhive_technician_app/core/services/base_api_service.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/data/urls.dart';
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
    required String addressline1,
    required String addressline2,
    required String city,
    required String district,
    required String state,
    required String country,
    required String pincode,
    required String password,
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
        'addressline1': addressline1,
        'addressline2': addressline2,
        'city': city,
        'district': district,
        'state': state,
        'country': country,
        'pincode': pincode,
        'password': password,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> requestLeave({
    required String technicianId,
    required String email,
    required String fromDate,
    required String toDate,
    required int numberOfDays,
    required String reason,
  }) async {
    return makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.RequestLeave.url,
      method: SettingsUrl.RequestLeave.method,
      body: {
        'technician_id': technicianId,
        'email': email,
        'from_date': fromDate,
        'to_date': toDate,
        'number_of_days': numberOfDays,
        'reason': reason,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> getTechnicianLeaveRequests({
    required String technicianId,
    required String email,
  }) async {
    return makeRequest<Map<String, dynamic>>(
      url: SettingsUrl.GetTechnicianLeaveRequests.url,
      method: SettingsUrl.GetTechnicianLeaveRequests.method,
      body: {
        'technician_id': technicianId,
        'email': email,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }
}
