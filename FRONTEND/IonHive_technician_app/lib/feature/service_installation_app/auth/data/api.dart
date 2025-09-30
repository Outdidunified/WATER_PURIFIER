import 'package:ionhive_technician_app/core/services/base_api_service.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/auth/data/urls.dart';

class TechnicianAuthAPICalls extends BaseApiService {
  Future<Map<String, dynamic>> login(String email, String password) async {
    final int parsedPassword = int.tryParse(password) ?? 0;
    return makeRequest<Map<String, dynamic>>(
      url: TechnicianAuthUrls.loginWithEmail.url,
      method: TechnicianAuthUrls.loginWithEmail.method,
      body: {'email': email, 'password': parsedPassword, 'role_id': 2},
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }
}
